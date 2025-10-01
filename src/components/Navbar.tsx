export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white py-6">
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <a href="#about" className="text-black hover:text-gray-600 transition-colors text-base font-light">
            About Us
          </a>
          <a href="#services" className="text-black hover:text-gray-600 transition-colors text-base font-light">
            Services
          </a>
          <a href="#partnership" className="text-black hover:text-gray-600 transition-colors text-base font-light">
            Partnership
          </a>
          <a href="#resources" className="text-black hover:text-gray-600 transition-colors text-base font-light">
            Resources
          </a>
          <a href="#blogs" className="text-black hover:text-gray-600 transition-colors text-base font-light">
            Blogs
          </a>
          <a href="#news" className="text-black hover:text-gray-600 transition-colors text-base font-light">
            News
          </a>
          <a href="#events" className="text-black hover:text-gray-600 transition-colors text-base font-light">
            Events
          </a>
          <a href="#we-care" className="text-black hover:text-gray-600 transition-colors text-base font-light">
            We Care
          </a>
          <a href="#contact" className="text-black hover:text-gray-600 transition-colors text-base font-light">
            Contact Us
          </a>
        </div>
        <img
          src="https://cosentus.com/wp-content/uploads/2021/08/New-Cosentus-Logo-1.png"
          alt="Cosentus Logo"
          className="h-10"
        />
      </div>
    </nav>
  );
}
