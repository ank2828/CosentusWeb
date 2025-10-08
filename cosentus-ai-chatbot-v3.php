<?php
/**
 * Plugin Name: Cosentus AI Chatbot v3
 * Description: AI-powered chatbot with lead capture, session management, and HubSpot integration
 * Version: 3.0
 * Author: Cosentus LLC
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

        $email = sanitize_email($_POST['email']);

        if (empty($email)) {
            wp_send_json_error('Email is required');
            return;
        }

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
        $text .= "Started: " . (isset($metadata['startedAt']) ? $metadata['startedAt'] : 'Unknown') . "\n";
        $text .= "Ended: " . (isset($metadata['endedAt']) ? $metadata['endedAt'] : 'Unknown') . "\n\n";
        $text .= "--- CONVERSATION ---\n\n";

        if (is_array($conversation)) {
            foreach ($conversation as $msg) {
                $sender = ($msg['sender'] === 'user') ? 'CUSTOMER' : 'COSE AI';
                $timestamp = isset($msg['timestamp']) ? date('g:i:s A', strtotime($msg['timestamp'])) : '';
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

        require_once(__DIR__ . '/cosentus-chatbot-styles-v3.php');
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
            'sessionTimeout' => intval($this->options['session_timeout']) * 60 * 1000, // Convert to ms
            'hubspotPortalId' => $this->options['hubspot_portal_id'],
            'hubspotFormId' => $this->options['hubspot_form_id']
        );

        require_once(__DIR__ . '/cosentus-chatbot-markup-v3.php');
        require_once(__DIR__ . '/cosentus-chatbot-script-v3.php');
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
                echo '<p class="description">HubSpot Private App Access Token (for contact search)</p>';
                break;
            case 'chat_webhook_url':
            case 'session_start_webhook_url':
            case 'session_end_webhook_url':
                echo '<input type="url" name="cosentus_chatbot_options_v3[' . $field . ']" value="' . esc_attr($value) . '" size="50" placeholder="https://your-n8n-instance.com/webhook/..." />';
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

    return '<button class="' . esc_attr($atts['trigger_class']) . '" onclick="if(window.cosentusChatbot) window.cosentusChatbot.open()">' .
           esc_html($atts['trigger_text']) . '</button>';
}
add_shortcode('cosentus_chat_trigger_v3', 'cosentus_chatbot_shortcode_v3');

?>
