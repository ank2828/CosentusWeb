<?php
/**
 * Plugin Name: Cosentus AI Chatbot v3
 * Description: AI-powered chatbot with lead capture, session management, and HubSpot integration
 * Version: 3.0.0
 * Author: Cosentus LLC
 * Author URI: https://cosentus.com
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class CosentusChatbotV3 {

    private $options;

    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_footer', array($this, 'render_chatbot'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('wp_head', array($this, 'add_inline_styles'));

        // AJAX handlers
        add_action('wp_ajax_cosentus_chat_message_v3', array($this, 'handle_chat_message'));
        add_action('wp_ajax_nopriv_cosentus_chat_message_v3', array($this, 'handle_chat_message'));
        add_action('wp_ajax_cosentus_search_contact_v3', array($this, 'handle_contact_search'));
        add_action('wp_ajax_nopriv_cosentus_search_contact_v3', array($this, 'handle_contact_search'));
        add_action('wp_ajax_cosentus_session_start_v3', array($this, 'handle_session_start'));
        add_action('wp_ajax_nopriv_cosentus_session_start_v3', array($this, 'handle_session_start'));
        add_action('wp_ajax_cosentus_session_end_v3', array($this, 'handle_session_end'));
        add_action('wp_ajax_nopriv_cosentus_session_end_v3', array($this, 'handle_session_end'));
    }

    public function init() {
        $this->options = get_option('cosentus_chatbot_options_v3', $this->get_default_options());
    }

    public function get_default_options() {
        return array(
            'enabled' => true,
            'chat_webhook_url' => '',
            'session_start_webhook_url' => '',
            'session_end_webhook_url' => '',
            'hubspot_access_token' => '',
            'hubspot_portal_id' => '',
            'hubspot_form_id' => '',
            'company_name' => 'Cosentus',
            'logo_url' => 'https://cosentus.com/wp-content/uploads/2021/08/New-Cosentus-Logo-1.png',
            'agent_logo_url' => 'https://cosentus.com/wp-content/uploads/2025/09/lion_transparent.png',
            'welcome_message' => 'Welcome to Cosentus! How may I help you today?',
            'primary_color' => '#01B2D6',
            'position' => 'bottom-right',
            'show_on_pages' => 'all',
            'specific_pages' => '',
            'exclude_pages' => '',
            'session_timeout' => 30, // minutes
        );
    }

    // Handle chat messages
    public function handle_chat_message() {
        $this->prevent_caching();

        if (!wp_verify_nonce($_POST['nonce'], 'cosentus_chat_nonce_v3')) {
            wp_die('Security check failed');
        }

        // Origin validation - only accept requests from same site
        $referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
        $site_url = get_site_url();

        if (empty($referer) || strpos($referer, $site_url) !== 0) {
            wp_send_json_error('Invalid request origin');
            return;
        }

        $message = sanitize_textarea_field($_POST['message']);
        $session_id = sanitize_text_field($_POST['session_id']);

        if (empty($message) || strlen($message) > 1000) {
            wp_send_json_error('Invalid message');
            return;
        }

        // Rate limiting
        $user_ip = $_SERVER['REMOTE_ADDR'];
        $rate_key = 'chatbot_limit_v3_' . md5($user_ip);
        $message_count = get_transient($rate_key) ?: 0;

        if ($message_count >= 10) {
            wp_send_json_error('Too many messages. Please wait a minute.');
            return;
        }

        $webhook_url = $this->options['chat_webhook_url'];

        if (empty($webhook_url)) {
            wp_send_json_error('Chatbot not configured');
            return;
        }

        $response = wp_remote_post($webhook_url, [
            'body' => wp_json_encode([
                'message' => $message,
                'sessionId' => $session_id,
                'timestamp' => current_time('mysql'),
                'source' => 'wordpress-chatbot-v3'
            ]),
            'headers' => [
                'Content-Type' => 'application/json'
            ],
            'timeout' => 30
        ]);

        set_transient($rate_key, $message_count + 1, 60);

        if (is_wp_error($response)) {
            error_log('Cosentus Chat: WP Error: ' . $response->get_error_message());
            wp_send_json_error('Service temporarily unavailable');
            return;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        $ai_response = $this->extract_ai_response($data, $body);

        wp_send_json_success([
            'message' => wp_kses_post($ai_response)
        ]);
    }

    // Handle HubSpot contact search
    public function handle_contact_search() {
        $this->prevent_caching();

        if (!wp_verify_nonce($_POST['nonce'], 'cosentus_chat_nonce_v3')) {
            wp_die('Security check failed');
        }

        // Origin validation - only accept requests from same site
        $referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
        $site_url = get_site_url();

        if (empty($referer) || strpos($referer, $site_url) !== 0) {
            wp_send_json_error('Invalid request origin');
            return;
        }

        $email = sanitize_email($_POST['email']);

        if (empty($email)) {
            wp_send_json_error('Email is required');
            return;
        }

        // Rate limiting for contact search
        $user_ip = $_SERVER['REMOTE_ADDR'];
        $rate_key = 'contact_search_limit_v3_' . md5($user_ip);
        $search_count = get_transient($rate_key) ?: 0;

        if ($search_count >= 10) {
            wp_send_json_error('Too many requests. Please wait a minute.');
            return;
        }

        set_transient($rate_key, $search_count + 1, 60);

        $hubspot_token = $this->options['hubspot_access_token'];

        if (empty($hubspot_token)) {
            wp_send_json_error('HubSpot not configured');
            return;
        }

        $search_response = wp_remote_post(
            'https://api.hubapi.com/crm/v3/objects/contacts/search',
            [
                'headers' => [
                    'Authorization' => 'Bearer ' . $hubspot_token,
                    'Content-Type' => 'application/json',
                ],
                'body' => wp_json_encode([
                    'filterGroups' => [
                        [
                            'filters' => [
                                [
                                    'propertyName' => 'email',
                                    'operator' => 'EQ',
                                    'value' => strtolower($email),
                                ],
                            ],
                        ],
                    ],
                ]),
                'timeout' => 15
            ]
        );

        if (is_wp_error($search_response)) {
            wp_send_json_error('Failed to search contact');
            return;
        }

        $search_data = json_decode(wp_remote_retrieve_body($search_response), true);

        if (isset($search_data['results']) && !empty($search_data['results'])) {
            wp_send_json_success([
                'contactId' => $search_data['results'][0]['id']
            ]);
        } else {
            wp_send_json_error('Contact not found');
        }
    }

    // Handle session start
    public function handle_session_start() {
        $this->prevent_caching();

        if (!wp_verify_nonce($_POST['nonce'], 'cosentus_chat_nonce_v3')) {
            wp_die('Security check failed');
        }

        // Origin validation - only accept requests from same site
        $referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
        $site_url = get_site_url();

        if (empty($referer) || strpos($referer, $site_url) !== 0) {
            wp_send_json_error('Invalid request origin');
            return;
        }

        $session_id = sanitize_text_field($_POST['session_id']);
        $first_name = sanitize_text_field($_POST['first_name']);
        $last_name = sanitize_text_field($_POST['last_name']);
        $email = sanitize_email($_POST['email']);
        $hubspot_contact_id = sanitize_text_field($_POST['hubspot_contact_id']);

        $webhook_url = $this->options['session_start_webhook_url'];

        if (empty($webhook_url)) {
            wp_send_json_success(['message' => 'No session start webhook configured']);
            return;
        }

        $response = wp_remote_post($webhook_url, [
            'body' => wp_json_encode([
                'sessionId' => $session_id,
                'firstName' => $first_name,
                'lastName' => $last_name,
                'email' => $email,
                'hubspotContactId' => $hubspot_contact_id,
                'timestamp' => current_time('c'),
                'source' => 'wordpress-chatbot-v3'
            ]),
            'headers' => [
                'Content-Type' => 'application/json'
            ],
            'timeout' => 15
        ]);

        if (is_wp_error($response)) {
            error_log('Cosentus Chat: Session start webhook error: ' . $response->get_error_message());
        }

        wp_send_json_success(['message' => 'Session started']);
    }

    // Handle session end
    public function handle_session_end() {
        $this->prevent_caching();

        if (!wp_verify_nonce($_POST['nonce'], 'cosentus_chat_nonce_v3')) {
            wp_die('Security check failed');
        }

        // Origin validation - only accept requests from same site
        $referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
        $site_url = get_site_url();

        if (empty($referer) || strpos($referer, $site_url) !== 0) {
            wp_send_json_error('Invalid request origin');
            return;
        }

        $session_id = sanitize_text_field($_POST['session_id']);
        $lead_data = json_decode(stripslashes($_POST['lead_data']), true);
        $reason = sanitize_text_field($_POST['reason']);
        $conversation = json_decode(stripslashes($_POST['conversation']), true);
        $metadata = json_decode(stripslashes($_POST['metadata']), true);

        // Format conversation text
        $conversation_text = $this->format_conversation_text($conversation, $metadata, $reason);

        $webhook_url = $this->options['session_end_webhook_url'];

        if (empty($webhook_url)) {
            wp_send_json_success(['message' => 'No session end webhook configured']);
            return;
        }

        $response = wp_remote_post($webhook_url, [
            'body' => wp_json_encode([
                'eventType' => 'session_end',
                'sessionId' => $session_id,
                'leadData' => $lead_data,
                'reason' => $reason,
                'timestamp' => current_time('c'),
                'conversation' => $conversation,
                'conversationText' => $conversation_text,
                'metadata' => $metadata,
                'source' => 'wordpress-chatbot-v3'
            ]),
            'headers' => [
                'Content-Type' => 'application/json'
            ],
            'timeout' => 15
        ]);

        if (is_wp_error($response)) {
            error_log('Cosentus Chat: Session end webhook error: ' . $response->get_error_message());
        }

        wp_send_json_success(['message' => 'Session ended']);
    }

    private function format_conversation_text($conversation, $metadata, $reason) {
        $text = "=== CHAT CONVERSATION ===\n\n";
        $text .= "Session ended: " . ($reason === 'timeout' ? 'Due to inactivity' : 'Manually closed') . "\n";
        $text .= "Duration: " . (isset($metadata['duration']) ? $metadata['duration'] : 'Unknown') . "\n";
        $text .= "Messages: " . (isset($metadata['messageCount']) ? $metadata['messageCount'] : 0) . "\n";

        // Format Started time in Pacific Time
        if (isset($metadata['startedAt'])) {
            $dt = new DateTime($metadata['startedAt'], new DateTimeZone('UTC'));
            $dt->setTimezone(new DateTimeZone('America/Los_Angeles'));
            $text .= "Started: " . $dt->format('n/j/Y, g:i:s A') . "\n";
        } else {
            $text .= "Started: Unknown\n";
        }

        // Format Ended time in Pacific Time
        if (isset($metadata['endedAt'])) {
            $dt = new DateTime($metadata['endedAt'], new DateTimeZone('UTC'));
            $dt->setTimezone(new DateTimeZone('America/Los_Angeles'));
            $text .= "Ended: " . $dt->format('n/j/Y, g:i:s A') . "\n\n";
        } else {
            $text .= "Ended: Unknown\n\n";
        }

        $text .= "--- CONVERSATION ---\n\n";

        if (is_array($conversation)) {
            foreach ($conversation as $msg) {
                $sender = ($msg['sender'] === 'user') ? 'CUSTOMER' : 'COSE AI';

                // Format message timestamp in Pacific Time
                $timestamp = '';
                if (isset($msg['timestamp'])) {
                    $dt = new DateTime($msg['timestamp'], new DateTimeZone('UTC'));
                    $dt->setTimezone(new DateTimeZone('America/Los_Angeles'));
                    $timestamp = $dt->format('g:i:s A');
                }

                $text .= "[" . $timestamp . "] " . $sender . ":\n" . $msg['text'] . "\n\n";
            }
        }

        return $text;
    }

    private function extract_ai_response($data, $body) {
        if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
            if (isset($data['message'])) return $data['message'];
            if (isset($data['output'])) return $data['output'];
            if (isset($data['response'])) return $data['response'];
            if (isset($data['text'])) return $data['text'];

            if (!empty($data) && isset($data[0])) {
                $first_item = $data[0];
                if (is_array($first_item)) {
                    if (isset($first_item['output'])) return $first_item['output'];
                    if (isset($first_item['message'])) return $first_item['message'];
                    if (isset($first_item['response'])) return $first_item['response'];
                }
                if (is_string($first_item)) return $first_item;
            }
        }

        $ai_response = trim($body);
        if (empty($ai_response)) {
            $ai_response = 'I received your message! However, I\'m having trouble generating a response right now. Please try again.';
        }

        return $ai_response;
    }

    private function prevent_caching() {
        if (ob_get_level()) {
            ob_end_clean();
        }

        if (!defined('DONOTCACHEPAGE')) {
            define('DONOTCACHEPAGE', true);
        }

        nocache_headers();

        header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0, private');
        header('Pragma: no-cache');
        header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');
        header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
        header('X-LiteSpeed-Cache-Control: no-cache, no-vary');
        header('X-LiteSpeed-Tag: chat-ajax-' . time());
        header('X-Accel-Expires: 0');
        header('Surrogate-Control: no-store');
        header('X-Cache: MISS');
        header('X-Request-ID: ' . uniqid('chat-', true));

        if (empty($this->options)) {
            $this->options = get_option('cosentus_chatbot_options_v3', $this->get_default_options());
        }
    }

    public function add_inline_styles() {
        if (!$this->should_show_chatbot()) {
            return;
        }

        $primary_color = esc_attr($this->options['primary_color']);

        echo '<style type="text/css">
/* Cosentus AI Chatbot v3 - Complete Styles */
.cosentus-chatbot-v3 * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.cosentus-chatbot-v3 {
    position: fixed;
    bottom: 20px;
    ' . ($this->options['position'] === 'bottom-left' ? 'left' : 'right') . ': 20px;
    z-index: 999999;
    font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.cosentus-chat-button-v3 {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #FFFFFF;
    border: none;
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(1, 178, 214, 1.0);
    font-size: 1.5rem;
    color: ' . $primary_color . ';
}

.cosentus-chat-button-v3:hover {
    transform: scale(1.1);
    box-shadow: 0 0 30px rgba(1, 178, 214, 1.0);
}

.cosentus-chat-button-v3 .v-arrow {
    display: none;
}

.cosentus-chat-button-v3.chat-open .fa-comments {
    display: none;
}

.cosentus-chat-button-v3.chat-open .v-arrow {
    display: flex;
    position: absolute;
    align-items: center;
    justify-content: center;
}

.custom-arrow-down-v3 {
    width: 14px;
    height: 14px;
    border-right: 2px solid ' . $primary_color . ';
    border-bottom: 2px solid ' . $primary_color . ';
    transform: rotate(45deg);
    margin-top: -2px;
}

.cosentus-chat-pulse-v3 {
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    background: #FFFFFF;
    opacity: 0.7;
    animation: cosentus-pulse-v3 2s infinite;
}

@keyframes cosentus-pulse-v3 {
    0% { transform: scale(1); opacity: 0.7; }
    70% { transform: scale(1.2); opacity: 0; }
    100% { transform: scale(1.2); opacity: 0; }
}

.cosentus-chat-window-v3 {
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 350px;
    height: 600px;
    background: #FFFFFF;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    display: none;
    flex-direction: column;
    animation: cosentus-slideUp-v3 0.3s ease;
}

@keyframes cosentus-slideUp-v3 {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes cosentus-slideDown-v3 {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
}

.cosentus-chat-window-v3.slide-down {
    animation: cosentus-slideDown-v3 0.3s ease;
}

.cosentus-chat-header-v3 {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-radius: 16px 16px 0 0;
    background: #000000;
    position: relative;
}

.cosentus-chat-info-v3 {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.cosentus-chat-logo-v3 {
    max-height: 40px;
    width: auto;
    max-width: 160px;
    object-fit: contain;
}

.cosentus-think-growth-text-v3 {
    font-family: "Montserrat", sans-serif;
    font-style: italic;
    font-weight: 400;
    font-size: 0.75rem;
    color: #ffffff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.9;
}

.cosentus-chat-close-v3 {
    position: absolute !important;
    top: 12px !important;
    right: 12px !important;
    background: transparent !important;
    border: none !important;
    color: rgba(255, 255, 255, 0.9) !important;
    cursor: pointer !important;
    font-size: 24px !important;
    padding: 6px !important;
    transition: all 0.2s ease !important;
    line-height: 1 !important;
}

.cosentus-chat-close-v3:hover {
    color: #FFFFFF !important;
}

.cosentus-chat-messages-v3 {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: #FFFFFF;
}

.cosentus-chat-messages-v3::-webkit-scrollbar {
    width: 4px;
}

.cosentus-chat-messages-v3::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
}

.cosentus-message-v3 {
    display: flex;
    margin-bottom: 0.5rem;
    max-width: 85%;
    animation: cosentus-fadeIn-v3 0.3s ease;
}

@keyframes cosentus-fadeIn-v3 {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.cosentus-message-v3.bot-message {
    align-self: flex-start;
}

.cosentus-message-v3.user-message {
    align-self: flex-end;
}

.cosentus-message-content-v3 {
    padding: 0.8rem 1.1rem;
    border-radius: 20px;
    word-wrap: break-word;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    font-size: 0.9rem !important;
    line-height: 1.4 !important;
}

.cosentus-message-content-v3 p {
    font-size: 0.9rem !important;
    line-height: 1.4 !important;
    margin: 0 !important;
}

.cosentus-message-v3.bot-message .cosentus-message-content-v3 {
    background: #EBEBEB;
    color: #000000;
}

.cosentus-message-v3.user-message .cosentus-message-content-v3 {
    background: #000000;
    color: #FFFFFF;
}

.cosentus-agent-title-v3 {
    font-size: 0.92rem !important;
    font-weight: 600 !important;
    color: #000000 !important;
    display: flex !important;
    align-items: center !important;
    gap: 0.4rem !important;
    margin-bottom: 0.4rem !important;
}

.cosentus-agent-logo-v3 {
    width: 32px !important;
    height: 32px !important;
    object-fit: contain !important;
    border-radius: 50% !important;
}

.cosentus-chat-input-area-v3 {
    padding: 1rem;
    background: #FFFFFF;
    border-radius: 0 0 16px 16px;
}

.cosentus-chat-input-container-v3 {
    position: relative;
    display: flex;
    align-items: center;
}

.cosentus-chat-input-v3 {
    width: 100% !important;
    background: #FFFFFF !important;
    border: 1px solid rgba(0, 0, 0, 0.2) !important;
    border-radius: 24px !important;
    padding: 1rem 3.5rem 1rem 1rem !important;
    color: #000000 !important;
    font-size: 0.85rem !important;
    resize: none !important;
    outline: none !important;
    font-family: inherit !important;
}

.cosentus-chat-input-v3:focus {
    border-color: rgba(0, 0, 0, 0.3) !important;
}

.cosentus-chat-send-v3 {
    position: absolute !important;
    right: 8px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
    min-height: 32px !important;
    max-width: 32px !important;
    max-height: 32px !important;
    background: rgba(0, 0, 0, 0.1) !important;
    border: none !important;
    border-radius: 50% !important;
    color: #000000 !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 0.9rem !important;
    padding: 0 !important;
    box-shadow: none !important;
}

.cosentus-chat-send-v3:hover {
    background: rgba(0, 0, 0, 0.2) !important;
    transform: translateY(-50%) !important;
}

.cosentus-chat-send-v3:disabled {
    opacity: 0.3 !important;
    cursor: not-allowed !important;
    transform: translateY(-50%) !important;
}

.cosentus-chat-send-v3.disabled-during-lead-capture {
    opacity: 0.2 !important;
    cursor: not-allowed !important;
    pointer-events: none !important;
    background: rgba(0, 0, 0, 0.05) !important;
}

.cosentus-chat-input-container-v3 {
    position: relative;
}

.cosentus-chat-input-container-v3.has-tooltip::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 8px;
    padding: 8px 12px;
    background: #333;
    color: #fff;
    font-size: 0.75rem;
    border-radius: 6px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    z-index: 1000;
}

.cosentus-chat-input-container-v3.has-tooltip:hover::after {
    opacity: 1;
}

.cosentus-chat-disclaimer-v3 {
    text-align: center !important;
    font-size: 11px !important;
    color: #999999 !important;
    margin-top: 8px !important;
    line-height: 1.2 !important;
}

.cosentus-loading-dots-v3 {
    display: flex;
    gap: 0.3rem;
    padding: 0.5rem 0;
}

.cosentus-loading-dots-v3 span {
    width: 8px;
    height: 8px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 50%;
    animation: cosentus-loadingDots-v3 1.4s ease-in-out infinite both;
}

.cosentus-loading-dots-v3 span:nth-child(1) { animation-delay: -0.32s; }
.cosentus-loading-dots-v3 span:nth-child(2) { animation-delay: -0.16s; }

@keyframes cosentus-loadingDots-v3 {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1.2); opacity: 1; }
}

/* Lead Capture Form Styles */
.cosentus-lead-capture-v3 {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 2rem 1.5rem;
    animation: cosentus-fadeIn-v3 0.3s ease;
}

.cosentus-lead-title-v3 {
    font-size: 1.35rem;
    font-weight: 700;
    color: #000000;
    margin-bottom: 0.5rem;
    text-align: center;
}

.cosentus-lead-subtitle-v3 {
    font-size: 0.9rem;
    color: #666666;
    margin-bottom: 1.5rem;
    text-align: center;
}

.cosentus-lead-form-v3 {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
}

.cosentus-lead-input-v3 {
    width: 100% !important;
    padding: 0.8rem 0.9rem !important;
    font-size: 0.9rem !important;
    border: 2px solid #E5E5E5 !important;
    border-radius: 10px !important;
    outline: none !important;
    transition: all 0.2s ease !important;
    font-family: inherit !important;
    box-shadow: none !important;
}

.cosentus-lead-input-v3:focus {
    border-color: ' . $primary_color . ' !important;
    box-shadow: 0 0 0 3px rgba(1, 178, 214, 0.1) !important;
}

.cosentus-lead-button-v3 {
    width: 100% !important;
    padding: 0.8rem 1rem !important;
    font-size: 0.95rem !important;
    font-weight: 600 !important;
    color: #FFFFFF !important;
    background: #000000 !important;
    border: none !important;
    border-radius: 10px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    margin-top: 0.25rem !important;
    box-shadow: none !important;
    text-align: center !important;
}

.cosentus-lead-button-v3:hover {
    background: #1a1a1a !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
}

.cosentus-lead-button-v3:disabled {
    opacity: 0.6 !important;
    cursor: not-allowed !important;
    transform: none !important;
}

.cosentus-lead-back-v3 {
    width: 100% !important;
    padding: 0.8rem 1rem !important;
    font-size: 0.95rem !important;
    font-weight: 600 !important;
    color: #FFFFFF !important;
    background: ' . $primary_color . ' !important;
    border: none !important;
    border-radius: 10px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    box-shadow: none !important;
    text-align: center !important;
}

.cosentus-lead-back-v3:hover {
    background: #0199b8 !important;
}

.cosentus-lead-error-v3 {
    color: #DC2626;
    font-size: 0.85rem;
    text-align: center;
    margin-top: -0.25rem;
}

.cosentus-lead-steps-v3 {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
}

.cosentus-lead-step-v3 {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #E5E5E5;
    transition: all 0.3s ease;
}

.cosentus-lead-step-v3.active {
    background: ' . $primary_color . ';
    width: 24px;
    border-radius: 4px;
}

/* Teaser Card Styles */
.cosentus-teaser-card-v3 {
    position: absolute;
    bottom: 75px;
    right: 0;
    background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    padding: 1rem 1.25rem;
    display: none;
    opacity: 0;
    transform: translateY(20px);
    animation: cosentus-teaserSlideIn-v3 0.4s ease forwards;
    width: 280px;
    border: 1px solid rgba(1, 178, 214, 0.2);
}

@keyframes cosentus-teaserSlideIn-v3 {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.cosentus-teaser-card-v3.hiding {
    animation: cosentus-teaserSlideOut-v3 0.3s ease forwards;
}

@keyframes cosentus-teaserSlideOut-v3 {
    to {
        opacity: 0;
        transform: translateY(10px);
    }
}

.cosentus-teaser-header-v3 {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.cosentus-teaser-avatar-v3 {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: contain;
    border: 2px solid ' . $primary_color . ';
    flex-shrink: 0;
    padding: 2px;
    background: #FFFFFF;
}

.cosentus-teaser-content-v3 {
    flex: 1;
    min-width: 0;
}

.cosentus-teaser-close-v3 {
    background: transparent !important;
    border: none !important;
    color: #999 !important;
    cursor: pointer !important;
    font-size: 20px !important;
    padding: 0 !important;
    line-height: 1 !important;
    width: 20px !important;
    height: 20px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: color 0.2s ease !important;
    flex-shrink: 0;
}

.cosentus-teaser-close-v3:hover {
    color: #333 !important;
}

.cosentus-teaser-title-v3 {
    font-size: 0.95rem;
    font-weight: 600;
    color: #000000;
    margin-bottom: 0.35rem;
}

.cosentus-teaser-message-v3 {
    font-size: 0.85rem;
    color: #666666;
    line-height: 1.4;
}

.cosentus-teaser-cta-v3 {
    width: 100%;
    padding: 0.65rem 1rem !important;
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    color: #FFFFFF !important;
    background: ' . $primary_color . ' !important;
    border: none !important;
    border-radius: 10px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    text-align: center !important;
    margin-top: 0.5rem !important;
}

.cosentus-teaser-cta-v3:hover {
    background: #0199b8 !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(1, 178, 214, 0.3) !important;
}

@media (max-width: 768px) {
    .cosentus-chatbot-v3 {
        bottom: 10px !important;
        right: 10px !important;
    }

    .cosentus-chat-window-v3 {
        position: fixed !important;
        bottom: 70px !important;
        left: 10px !important;
        right: 10px !important;
        width: auto !important;
        height: 70vh !important;
        max-height: 600px !important;
    }

    .cosentus-teaser-card-v3 {
        width: 260px;
        bottom: 70px;
        right: 0;
    }
}
</style>';
    }

    public function enqueue_scripts() {
        if (!$this->should_show_chatbot()) {
            return;
        }

        wp_enqueue_script('jquery');
        wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        wp_enqueue_style('cosentus-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap');
    }

    public function render_chatbot() {
        if (!$this->should_show_chatbot()) {
            return;
        }

        $config = array(
            'companyName' => $this->options['company_name'],
            'logoUrl' => $this->options['logo_url'],
            'agentLogoUrl' => $this->options['agent_logo_url'],
            'welcomeMessage' => $this->options['welcome_message'],
            'primaryColor' => $this->options['primary_color'],
            'position' => $this->options['position'],
            'sessionTimeout' => intval($this->options['session_timeout']) * 60 * 1000,
            'hubspotPortalId' => $this->options['hubspot_portal_id'],
            'hubspotFormId' => $this->options['hubspot_form_id']
        );

        ?>
        <div class="cosentus-chatbot-v3">
            <!-- Teaser Card -->
            <div class="cosentus-teaser-card-v3">
                <div class="cosentus-teaser-header-v3">
                    <img src="<?php echo esc_attr($config['agentLogoUrl']); ?>" alt="COSE AI" class="cosentus-teaser-avatar-v3">
                    <div class="cosentus-teaser-content-v3">
                        <div class="cosentus-teaser-title-v3">Hey! I'm COSE AI 👋</div>
                        <div class="cosentus-teaser-message-v3">Need help? Let's chat!</div>
                    </div>
                    <button class="cosentus-teaser-close-v3" aria-label="Dismiss">×</button>
                </div>
                <button class="cosentus-teaser-cta-v3">Start Chatting</button>
            </div>

            <div class="cosentus-chat-button-v3">
                <i class="fas fa-comments"></i>
                <div class="v-arrow">
                    <div class="custom-arrow-down-v3"></div>
                </div>
                <div class="cosentus-chat-pulse-v3"></div>
            </div>

            <div class="cosentus-chat-window-v3">
                <div class="cosentus-chat-header-v3">
                    <div class="cosentus-chat-info-v3">
                        <img src="<?php echo esc_attr($config['logoUrl']); ?>" alt="<?php echo esc_attr($config['companyName']); ?>" class="cosentus-chat-logo-v3">
                        <div class="cosentus-think-growth-text-v3">THINK GROWTH</div>
                    </div>
                    <button class="cosentus-chat-close-v3">×</button>
                </div>

                <div class="cosentus-chat-messages-v3"></div>

                <div class="cosentus-chat-input-area-v3">
                    <div class="cosentus-chat-input-container-v3">
                        <input type="text" class="cosentus-chat-input-v3" placeholder="Message..." />
                        <button class="cosentus-chat-send-v3">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <div class="cosentus-chat-disclaimer-v3">
                        Powered by <em>COSE AI</em> - Responses are informational only
                    </div>
                </div>
            </div>
        </div>

        <script>
        window.cosentusAjaxV3 = {
            ajaxurl: '<?php echo admin_url('admin-ajax.php'); ?>',
            nonce: '<?php echo wp_create_nonce('cosentus_chat_nonce_v3'); ?>'
        };
        </script>

        <script>
        (function() {
            'use strict';

            var $ = jQuery || window.jQuery;

            if (typeof $ === 'undefined' || typeof cosentusAjaxV3 === 'undefined') {
                console.error('Cosentus Chat V3: Required dependencies not loaded');
                return;
            }

            const SESSION_TIMEOUT = <?php echo intval($this->options['session_timeout']) * 60 * 1000; ?>;
            const HUBSPOT_PORTAL_ID = '<?php echo esc_js($this->options['hubspot_portal_id']); ?>';
            const HUBSPOT_FORM_ID = '<?php echo esc_js($this->options['hubspot_form_id']); ?>';

            class CosentusChatbot {
                constructor(config) {
                    this.config = config;
                    this.isOpen = false;
                    this.messages = [];
                    this.isTyping = false;
                    this.session = null;
                    this.needsLeadCapture = true;
                    this.timeoutRef = null;
                    this.hasLoadedMessages = false;
                    this.teaserTimeout = null;

                    this.init();
                }

                init() {
                    this.initElements();
                    this.loadOrCreateSession();
                    this.attachEventListeners();
                    this.initTeaser();

                    if (!this.needsLeadCapture) {
                        this.loadMessages();
                    }
                }

                initElements() {
                    this.chatButton = document.querySelector('.cosentus-chat-button-v3');
                    this.chatWindow = document.querySelector('.cosentus-chat-window-v3');
                    this.chatClose = document.querySelector('.cosentus-chat-close-v3');
                    this.chatInput = document.querySelector('.cosentus-chat-input-v3');
                    this.chatSend = document.querySelector('.cosentus-chat-send-v3');
                    this.chatMessages = document.querySelector('.cosentus-chat-messages-v3');
                    this.teaserCard = document.querySelector('.cosentus-teaser-card-v3');
                    this.teaserClose = document.querySelector('.cosentus-teaser-close-v3');
                    this.teaserCta = document.querySelector('.cosentus-teaser-cta-v3');
                }

                initTeaser() {
                    // Check if teaser was dismissed recently
                    const dismissed = localStorage.getItem('cosentus_teaser_dismissed_v3');

                    if (dismissed) {
                        const dismissedTime = parseInt(dismissed, 10);
                        const now = Date.now();
                        const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);

                        // Show teaser again after 24 hours
                        if (hoursSinceDismissed < 24) {
                            return;
                        }
                    }

                    // Show teaser after 4 seconds
                    this.teaserTimeout = setTimeout(() => {
                        if (!this.isOpen) {
                            this.showTeaser();
                        }
                    }, 4000);

                    // Attach teaser event listeners
                    if (this.teaserClose) {
                        this.teaserClose.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.dismissTeaser();
                        });
                    }

                    if (this.teaserCta) {
                        this.teaserCta.addEventListener('click', () => {
                            this.hideTeaser();
                            this.toggleChat();
                        });
                    }
                }

                showTeaser() {
                    if (this.teaserCard) {
                        this.teaserCard.style.display = 'block';
                    }
                }

                hideTeaser() {
                    if (!this.teaserCard) return;

                    this.teaserCard.classList.add('hiding');

                    setTimeout(() => {
                        this.teaserCard.style.display = 'none';
                        this.teaserCard.classList.remove('hiding');
                    }, 300);

                    if (this.teaserTimeout) {
                        clearTimeout(this.teaserTimeout);
                    }
                }

                dismissTeaser() {
                    this.hideTeaser();
                    // Remember dismissal for 24 hours
                    localStorage.setItem('cosentus_teaser_dismissed_v3', Date.now().toString());
                }

                loadOrCreateSession() {
                    const stored = localStorage.getItem('cosentus_chat_session_v3');

                    if (stored) {
                        try {
                            const parsedSession = JSON.parse(stored);
                            const timeSinceLastActivity = Date.now() - parsedSession.lastActivityTime;

                            if (timeSinceLastActivity < SESSION_TIMEOUT && parsedSession.conversationActive) {
                                this.session = parsedSession;
                                // Only skip lead capture if session has lead data
                                this.needsLeadCapture = !parsedSession.leadData;
                                this.startInactivityTimer();
                            } else {
                                this.createNewSession();
                            }
                        } catch (error) {
                            console.error('Error parsing session:', error);
                            this.createNewSession();
                        }
                    } else {
                        this.createNewSession();
                    }
                }

                createNewSession() {
                    this.session = {
                        sessionId: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        lastActivityTime: Date.now(),
                        conversationActive: true
                    };

                    this.needsLeadCapture = true;
                    localStorage.setItem('cosentus_chat_session_v3', JSON.stringify(this.session));
                }

                loadMessages() {
                    if (!this.session || this.needsLeadCapture || this.hasLoadedMessages) return;

                    // Set flag immediately to prevent duplicate calls
                    this.hasLoadedMessages = true;

                    const stored = localStorage.getItem('cosentus_messages_v3_' + this.session.sessionId);
                    let loadedMessages = [];

                    if (stored) {
                        try {
                            loadedMessages = JSON.parse(stored);
                            loadedMessages.forEach(msg => {
                                this.addMessage(msg.text, msg.sender, false);
                            });
                        } catch (error) {
                            console.error('Error loading messages:', error);
                        }
                    }

                    // Only add welcome message if no messages were loaded from storage
                    if (loadedMessages.length === 0) {
                        this.addMessage(this.config.welcomeMessage, 'bot');
                    }
                }

                saveMessages() {
                    if (!this.session || this.needsLeadCapture) return;

                    localStorage.setItem(
                        'cosentus_messages_v3_' + this.session.sessionId,
                        JSON.stringify(this.messages)
                    );
                }

                attachEventListeners() {
                    this.chatButton.addEventListener('click', () => this.toggleChat());
                    this.chatClose.addEventListener('click', () => this.closeChatAndEndSession());
                    this.chatSend.addEventListener('click', () => this.sendMessage());
                    this.chatInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            this.sendMessage();
                        }
                    });

                    setTimeout(() => {
                        document.addEventListener('click', (e) => {
                            if (!e.target.closest('.cosentus-chatbot-v3') && this.isOpen) {
                                this.closeChat();
                            }
                        });
                    }, 100);
                }

                toggleChat() {
                    if (this.isOpen) {
                        this.closeChat();
                    } else {
                        this.openChat();
                    }
                }

                openChat() {
                    this.chatWindow.classList.remove('slide-down');
                    this.chatWindow.style.display = 'flex';
                    this.isOpen = true;

                    // Hide teaser when chat opens
                    this.hideTeaser();

                    const pulse = document.querySelector('.cosentus-chat-pulse-v3');
                    if (pulse) pulse.style.display = 'none';

                    this.chatButton.classList.add('chat-open');

                    if (this.needsLeadCapture) {
                        this.showLeadCapture();
                        this.disableSendButton();
                    } else {
                        if (!this.hasLoadedMessages) {
                            this.loadMessages();
                        }
                        this.enableSendButton();
                        setTimeout(() => this.chatInput.focus(), 320);
                    }
                }

                disableSendButton() {
                    this.chatSend.classList.add('disabled-during-lead-capture');
                    this.chatSend.disabled = true;
                    // Keep input enabled so users can type their message
                    this.chatInput.disabled = false;
                    this.chatInput.placeholder = 'Type your message...';

                    // Add tooltip to send button
                    this.chatSend.setAttribute('title', 'Please complete the form above to send message');
                }

                enableSendButton() {
                    this.chatSend.classList.remove('disabled-during-lead-capture');
                    this.chatSend.disabled = false;
                    this.chatInput.disabled = false;
                    this.chatInput.placeholder = 'Message...';

                    // Remove tooltip from send button
                    this.chatSend.removeAttribute('title');
                }

                closeChat() {
                    if (!this.isOpen) return;

                    this.isOpen = false;
                    this.chatButton.classList.remove('chat-open');

                    const pulse = document.querySelector('.cosentus-chat-pulse-v3');
                    if (pulse) pulse.style.display = 'block';

                    this.chatWindow.classList.add('slide-down');

                    const handleAnimationEnd = () => {
                        this.chatWindow.style.display = 'none';
                        this.chatWindow.classList.remove('slide-down');
                        this.chatWindow.removeEventListener('animationend', handleAnimationEnd);
                    };

                    this.chatWindow.addEventListener('animationend', handleAnimationEnd);

                    // Don't end session when minimizing - just close window
                    // Session stays active
                }

                closeChatAndEndSession() {
                    if (!this.isOpen) return;

                    this.isOpen = false;
                    this.chatButton.classList.remove('chat-open');

                    const pulse = document.querySelector('.cosentus-chat-pulse-v3');
                    if (pulse) pulse.style.display = 'block';

                    this.chatWindow.classList.add('slide-down');

                    const handleAnimationEnd = () => {
                        this.chatWindow.style.display = 'none';
                        this.chatWindow.classList.remove('slide-down');
                        this.chatWindow.removeEventListener('animationend', handleAnimationEnd);
                    };

                    this.chatWindow.addEventListener('animationend', handleAnimationEnd);

                    // End session when X is clicked
                    if (!this.needsLeadCapture) {
                        this.endSession('manual');
                    }
                }

                showLeadCapture() {
                    this.chatMessages.innerHTML = `
                        <div class="cosentus-lead-capture-v3">
                            <div class="cosentus-lead-steps-v3">
                                <div class="cosentus-lead-step-v3 active"></div>
                                <div class="cosentus-lead-step-v3"></div>
                            </div>

                            <div class="cosentus-lead-step-1-v3">
                                <h2 class="cosentus-lead-title-v3">Before we start...</h2>
                                <p class="cosentus-lead-subtitle-v3">Let's get to know each other</p>

                                <div class="cosentus-lead-form-v3">
                                    <input type="text" class="cosentus-lead-input-v3" id="lead-first-name-v3" placeholder="First Name" autofocus />
                                    <input type="text" class="cosentus-lead-input-v3" id="lead-last-name-v3" placeholder="Last Name" />
                                    <div class="cosentus-lead-error-v3" id="lead-error-1-v3"></div>
                                    <button class="cosentus-lead-button-v3" id="lead-next-v3">Next →</button>
                                </div>
                            </div>

                            <div class="cosentus-lead-step-2-v3" style="display: none;">
                                <h2 class="cosentus-lead-title-v3">Great! One more thing...</h2>
                                <p class="cosentus-lead-subtitle-v3">What's your email address?</p>

                                <div class="cosentus-lead-form-v3">
                                    <input type="email" class="cosentus-lead-input-v3" id="lead-email-v3" placeholder="Email Address" />
                                    <div class="cosentus-lead-error-v3" id="lead-error-2-v3"></div>
                                    <button class="cosentus-lead-button-v3" id="lead-submit-v3">Start Chat</button>
                                    <button class="cosentus-lead-back-v3" id="lead-back-v3">← Back</button>
                                </div>
                            </div>
                        </div>
                    `;

                    this.attachLeadCaptureListeners();
                }

                attachLeadCaptureListeners() {
                    const nextBtn = document.getElementById('lead-next-v3');
                    const backBtn = document.getElementById('lead-back-v3');
                    const submitBtn = document.getElementById('lead-submit-v3');
                    const firstNameInput = document.getElementById('lead-first-name-v3');
                    const lastNameInput = document.getElementById('lead-last-name-v3');
                    const emailInput = document.getElementById('lead-email-v3');

                    nextBtn.addEventListener('click', () => this.handleStep1Next());
                    backBtn.addEventListener('click', () => this.handleStepBack());
                    submitBtn.addEventListener('click', () => this.handleStep2Submit());

                    firstNameInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            lastNameInput.focus();
                        }
                    });

                    lastNameInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            this.handleStep1Next();
                        }
                    });

                    emailInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            this.handleStep2Submit();
                        }
                    });
                }

                handleStep1Next() {
                    const firstName = document.getElementById('lead-first-name-v3').value.trim();
                    const lastName = document.getElementById('lead-last-name-v3').value.trim();
                    const errorDiv = document.getElementById('lead-error-1-v3');

                    if (!firstName) {
                        errorDiv.textContent = 'Please enter your first name';
                        return;
                    }

                    if (!lastName) {
                        errorDiv.textContent = 'Please enter your last name';
                        return;
                    }

                    errorDiv.textContent = '';

                    const steps = document.querySelectorAll('.cosentus-lead-step-v3');
                    steps[0].classList.remove('active');
                    steps[1].classList.add('active');

                    document.querySelector('.cosentus-lead-step-1-v3').style.display = 'none';
                    document.querySelector('.cosentus-lead-step-2-v3').style.display = 'block';

                    setTimeout(() => document.getElementById('lead-email-v3').focus(), 100);
                }

                handleStepBack() {
                    const steps = document.querySelectorAll('.cosentus-lead-step-v3');
                    steps[1].classList.remove('active');
                    steps[0].classList.add('active');

                    document.querySelector('.cosentus-lead-step-2-v3').style.display = 'none';
                    document.querySelector('.cosentus-lead-step-1-v3').style.display = 'block';

                    document.getElementById('lead-error-2-v3').textContent = '';
                }

                async handleStep2Submit() {
                    const firstName = document.getElementById('lead-first-name-v3').value.trim();
                    const lastName = document.getElementById('lead-last-name-v3').value.trim();
                    const email = document.getElementById('lead-email-v3').value.trim();
                    const errorDiv = document.getElementById('lead-error-2-v3');
                    const submitBtn = document.getElementById('lead-submit-v3');

                    if (!email) {
                        errorDiv.textContent = 'Please enter your email address';
                        return;
                    }

                    if (!this.validateEmail(email)) {
                        errorDiv.textContent = 'Please enter a valid email address';
                        return;
                    }

                    errorDiv.textContent = '';
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Starting Chat...';

                    try {
                        let hubspotContactId = null;

                        // Submit to HubSpot Forms API
                        if (HUBSPOT_PORTAL_ID && HUBSPOT_FORM_ID) {
                            try {
                                const hubspotResponse = await fetch(
                                    `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`,
                                    {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            fields: [
                                                { name: 'firstname', value: firstName },
                                                { name: 'lastname', value: lastName },
                                                { name: 'email', value: email.toLowerCase() }
                                            ],
                                            context: {
                                                pageUri: window.location.href,
                                                pageName: document.title
                                            }
                                        })
                                    }
                                );

                                if (hubspotResponse.ok) {
                                    // Search for contact ID
                                    try {
                                        const searchResponse = await $.ajax({
                                            url: cosentusAjaxV3.ajaxurl,
                                            type: 'POST',
                                            data: {
                                                action: 'cosentus_search_contact_v3',
                                                nonce: cosentusAjaxV3.nonce,
                                                email: email.toLowerCase()
                                            }
                                        });

                                        if (searchResponse.success && searchResponse.data.contactId) {
                                            hubspotContactId = searchResponse.data.contactId;
                                        }
                                    } catch (searchErr) {
                                        console.error('Contact search error:', searchErr);
                                    }
                                }
                            } catch (hubspotErr) {
                                console.error('HubSpot submission error:', hubspotErr);
                            }
                        }

                        // Save lead data to session
                        this.session.leadData = {
                            firstName,
                            lastName,
                            email: email.toLowerCase(),
                            hubspotContactId
                        };

                        this.session.lastActivityTime = Date.now();
                        localStorage.setItem('cosentus_chat_session_v3', JSON.stringify(this.session));

                        this.needsLeadCapture = false;

                        // Send session start webhook
                        try {
                            await $.ajax({
                                url: cosentusAjaxV3.ajaxurl,
                                type: 'POST',
                                data: {
                                    action: 'cosentus_session_start_v3',
                                    nonce: cosentusAjaxV3.nonce,
                                    session_id: this.session.sessionId,
                                    first_name: firstName,
                                    last_name: lastName,
                                    email: email.toLowerCase(),
                                    hubspot_contact_id: hubspotContactId || ''
                                }
                            });
                        } catch (webhookErr) {
                            console.error('Session start webhook error:', webhookErr);
                        }

                        // Clear lead capture and show chat
                        this.chatMessages.innerHTML = '';
                        this.loadMessages();
                        this.startInactivityTimer();

                        // Enable the send button now that form is complete
                        this.enableSendButton();

                        setTimeout(() => this.chatInput.focus(), 100);

                    } catch (error) {
                        errorDiv.textContent = 'Something went wrong. Please try again.';
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Start Chat';
                        console.error('Lead capture error:', error);
                    }
                }

                validateEmail(email) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                }

                startInactivityTimer() {
                    if (this.timeoutRef) {
                        clearTimeout(this.timeoutRef);
                    }

                    this.timeoutRef = setTimeout(() => {
                        this.endSession('timeout');
                    }, SESSION_TIMEOUT);
                }

                updateActivity() {
                    if (!this.session) return;

                    this.session.lastActivityTime = Date.now();
                    localStorage.setItem('cosentus_chat_session_v3', JSON.stringify(this.session));

                    if (this.timeoutRef) {
                        clearTimeout(this.timeoutRef);
                    }
                    this.startInactivityTimer();
                }

                async endSession(reason) {
                    if (!this.session || !this.session.conversationActive) return;

                    const conversationData = this.messages;

                    const startedAt = conversationData.length > 0
                        ? new Date(conversationData[0].timestamp)
                        : new Date();
                    const endedAt = new Date();
                    const duration = conversationData.length > 0
                        ? Math.round((endedAt - new Date(conversationData[0].timestamp)) / 60000)
                        : 0;

                    try {
                        await $.ajax({
                            url: cosentusAjaxV3.ajaxurl,
                            type: 'POST',
                            data: {
                                action: 'cosentus_session_end_v3',
                                nonce: cosentusAjaxV3.nonce,
                                session_id: this.session.sessionId,
                                lead_data: JSON.stringify(this.session.leadData || null),
                                reason: reason,
                                conversation: JSON.stringify(conversationData),
                                metadata: JSON.stringify({
                                    messageCount: conversationData.length,
                                    duration: duration + ' minutes',
                                    startedAt: startedAt.toISOString(),
                                    endedAt: endedAt.toISOString()
                                })
                            }
                        });
                    } catch (error) {
                        console.error('Session end error:', error);
                    }

                    this.session.conversationActive = false;
                    localStorage.setItem('cosentus_chat_session_v3', JSON.stringify(this.session));

                    if (this.timeoutRef) {
                        clearTimeout(this.timeoutRef);
                        this.timeoutRef = null;
                    }
                }

                async sendMessage() {
                    const message = this.chatInput.value.trim();
                    if (!message || this.isTyping) return;

                    this.addMessage(message, 'user');
                    this.chatInput.value = '';
                    this.updateActivity();

                    setTimeout(() => this.showTypingIndicator(), 1000);

                    try {
                        const response = await $.ajax({
                            url: cosentusAjaxV3.ajaxurl,
                            type: 'POST',
                            data: {
                                action: 'cosentus_chat_message_v3',
                                nonce: cosentusAjaxV3.nonce,
                                message: message,
                                session_id: this.session.sessionId,
                                _t: Date.now()
                            },
                            cache: false
                        });

                        this.hideTypingIndicator();

                        if (response.success) {
                            setTimeout(() => {
                                this.addMessage(response.data.message, 'bot');
                            }, 500);
                        } else {
                            throw new Error(response.data || 'Request failed');
                        }
                    } catch (error) {
                        console.error('Chat error:', error);
                        this.hideTypingIndicator();

                        setTimeout(() => {
                            this.addMessage(
                                "I apologize, but I'm currently experiencing technical difficulties. Please try again later.",
                                'bot'
                            );
                        }, 500);
                    }
                }

                addMessage(text, sender, save = true) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `cosentus-message-v3 ${sender}-message`;

                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'cosentus-message-content-v3';

                    if (sender === 'bot') {
                        contentDiv.innerHTML = `
                            <div class="cosentus-agent-title-v3">
                                <img src="<?php echo esc_js($this->options['agent_logo_url']); ?>" alt="AI Agent" class="cosentus-agent-logo-v3">
                                ${this.config.companyName} AI Agent
                            </div>
                            <p>${this.formatMessage(text)}</p>
                        `;
                    } else {
                        contentDiv.innerHTML = `<p>${this.formatMessage(text)}</p>`;
                    }

                    messageDiv.appendChild(contentDiv);
                    this.chatMessages.appendChild(messageDiv);
                    this.scrollToBottom();

                    if (save) {
                        this.messages.push({
                            text: text,
                            sender: sender,
                            timestamp: new Date().toISOString()
                        });
                        this.saveMessages();
                    }
                }

                formatMessage(text) {
                    return text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n\n/g, '<br><br>')
                        .replace(/\n/g, '<br>');
                }

                showTypingIndicator() {
                    this.isTyping = true;
                    this.chatSend.disabled = true;

                    const typingDiv = document.createElement('div');
                    typingDiv.className = 'cosentus-message-v3 bot-message cosentus-typing-indicator-v3';
                    typingDiv.innerHTML = `
                        <div class="cosentus-message-content-v3">
                            <div class="cosentus-agent-title-v3">
                                <img src="<?php echo esc_js($this->options['agent_logo_url']); ?>" alt="AI Agent" class="cosentus-agent-logo-v3">
                                ${this.config.companyName} AI Agent
                            </div>
                            <div class="cosentus-loading-dots-v3">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    `;

                    this.chatMessages.appendChild(typingDiv);
                    this.scrollToBottom();
                }

                hideTypingIndicator() {
                    this.isTyping = false;
                    this.chatSend.disabled = false;

                    const typingIndicator = document.querySelector('.cosentus-typing-indicator-v3');
                    if (typingIndicator) {
                        typingIndicator.remove();
                    }
                }

                scrollToBottom() {
                    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
                }
            }

            function initChatbot() {
                if (window.cosentusChatbot) return;

                const button = document.querySelector('.cosentus-chat-button-v3');
                if (!button) {
                    setTimeout(initChatbot, 500);
                    return;
                }

                try {
                    window.cosentusChatbot = new CosentusChatbot(<?php echo wp_json_encode($config); ?>);
                } catch (error) {
                    console.error('Cosentus Chat: Initialization failed', error);
                }
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initChatbot);
            } else {
                initChatbot();
            }

            $(document).ready(function() {
                setTimeout(initChatbot, 200);
            });

        })();
        </script>
        <?php
    }

    private function should_show_chatbot() {
        if (!$this->options['enabled']) {
            return false;
        }

        $show_on = $this->options['show_on_pages'];
        $current_page_id = get_the_ID();

        if (!empty($this->options['exclude_pages'])) {
            $exclude_pages = array_map('trim', explode(',', $this->options['exclude_pages']));
            if (in_array($current_page_id, $exclude_pages)) {
                return false;
            }
        }

        switch ($show_on) {
            case 'home':
                return is_front_page();
            case 'specific':
                if (!empty($this->options['specific_pages'])) {
                    $specific_pages = array_map('trim', explode(',', $this->options['specific_pages']));
                    return in_array($current_page_id, $specific_pages);
                }
                return false;
            case 'all':
            default:
                return true;
        }
    }

    public function add_admin_menu() {
        add_options_page(
            'COSE AI Chatbot Settings',
            'COSE AI Chatbot',
            'manage_options',
            'cosentus-chatbot-v3',
            array($this, 'admin_page')
        );
    }

    public function admin_init() {
        register_setting('cosentus_chatbot_group_v3', 'cosentus_chatbot_options_v3');

        add_settings_section(
            'cosentus_chatbot_main',
            'Main Settings',
            null,
            'cosentus-chatbot-v3'
        );

        $fields = array(
            'enabled' => 'Enable Chatbot',
            'chat_webhook_url' => 'Chat Message Webhook URL',
            'session_start_webhook_url' => 'Session Start Webhook URL',
            'session_end_webhook_url' => 'Session End Webhook URL',
            'hubspot_access_token' => 'HubSpot Access Token',
            'hubspot_portal_id' => 'HubSpot Portal ID',
            'hubspot_form_id' => 'HubSpot Form ID',
            'company_name' => 'Company Name',
            'logo_url' => 'Company Logo URL',
            'agent_logo_url' => 'Agent Logo URL',
            'welcome_message' => 'Welcome Message',
            'primary_color' => 'Primary Color',
            'position' => 'Position',
            'session_timeout' => 'Session Timeout (minutes)',
            'show_on_pages' => 'Show On Pages',
            'specific_pages' => 'Specific Page IDs (comma separated)',
            'exclude_pages' => 'Exclude Page IDs (comma separated)',
        );

        foreach ($fields as $field => $label) {
            add_settings_field(
                $field,
                $label,
                array($this, 'render_field'),
                'cosentus-chatbot-v3',
                'cosentus_chatbot_main',
                array('field' => $field, 'label' => $label)
            );
        }
    }

    public function render_field($args) {
        $field = $args['field'];
        $value = isset($this->options[$field]) ? $this->options[$field] : '';

        switch ($field) {
            case 'enabled':
                echo '<input type="checkbox" name="cosentus_chatbot_options_v3[' . $field . ']" value="1" ' . checked(1, $value, false) . ' />';
                break;
            case 'welcome_message':
                echo '<textarea name="cosentus_chatbot_options_v3[' . $field . ']" rows="3" cols="50">' . esc_textarea($value) . '</textarea>';
                break;
            case 'position':
                $positions = array(
                    'bottom-right' => 'Bottom Right',
                    'bottom-left' => 'Bottom Left',
                );
                echo '<select name="cosentus_chatbot_options_v3[' . $field . ']">';
                foreach ($positions as $pos => $label) {
                    echo '<option value="' . $pos . '" ' . selected($value, $pos, false) . '>' . $label . '</option>';
                }
                echo '</select>';
                break;
            case 'show_on_pages':
                $options = array(
                    'all' => 'All Pages',
                    'home' => 'Home Page Only',
                    'specific' => 'Specific Pages Only'
                );
                echo '<select name="cosentus_chatbot_options_v3[' . $field . ']">';
                foreach ($options as $opt => $label) {
                    echo '<option value="' . $opt . '" ' . selected($value, $opt, false) . '>' . $label . '</option>';
                }
                echo '</select>';
                break;
            case 'primary_color':
                echo '<input type="color" name="cosentus_chatbot_options_v3[' . $field . ']" value="' . esc_attr($value) . '" />';
                break;
            case 'session_timeout':
                echo '<input type="number" name="cosentus_chatbot_options_v3[' . $field . ']" value="' . esc_attr($value) . '" min="1" max="120" />';
                echo '<p class="description">Minutes of inactivity before session expires (default: 30)</p>';
                break;
            case 'hubspot_access_token':
                echo '<input type="password" name="cosentus_chatbot_options_v3[' . $field . ']" value="' . esc_attr($value) . '" size="50" autocomplete="off" />';
                echo '<p class="description">HubSpot Private App Access Token</p>';
                break;
            case 'chat_webhook_url':
                echo '<input type="url" name="cosentus_chatbot_options_v3[' . $field . ']" value="' . esc_attr($value) . '" size="50" />';
                echo '<p class="description">n8n webhook for chat messages</p>';
                break;
            case 'session_start_webhook_url':
                echo '<input type="url" name="cosentus_chatbot_options_v3[' . $field . ']" value="' . esc_attr($value) . '" size="50" />';
                echo '<p class="description">n8n webhook for session start (optional)</p>';
                break;
            case 'session_end_webhook_url':
                echo '<input type="url" name="cosentus_chatbot_options_v3[' . $field . ']" value="' . esc_attr($value) . '" size="50" />';
                echo '<p class="description">n8n webhook for session end with conversation history</p>';
                break;
            default:
                echo '<input type="text" name="cosentus_chatbot_options_v3[' . $field . ']" value="' . esc_attr($value) . '" size="50" />';
                break;
        }
    }

    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>COSE AI Chatbot Settings v3</h1>
            <p>Complete chatbot with lead capture, session management, and HubSpot integration.</p>
            <form method="post" action="options.php">
                <?php
                settings_fields('cosentus_chatbot_group_v3');
                do_settings_sections('cosentus-chatbot-v3');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
}

// Initialize the plugin
global $cosentusChatbotV3Instance;
$cosentusChatbotV3Instance = new CosentusChatbotV3();

// Shortcode support
function cosentus_chatbot_shortcode_v3($atts) {
    $atts = shortcode_atts(array(
        'trigger_text' => 'Open Chat',
        'trigger_class' => 'cosentus-chat-trigger-button'
    ), $atts);

    return '<button class="' . esc_attr($atts['trigger_class']) . '" onclick="if(window.cosentusChatbot) window.cosentusChatbot.toggleChat()">' .
           esc_html($atts['trigger_text']) . '</button>';
}
add_shortcode('cosentus_chat_trigger_v3', 'cosentus_chatbot_shortcode_v3');

?>
