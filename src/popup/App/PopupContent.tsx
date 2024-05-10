import React, { useEffect, useState } from 'react';
import cheerio from 'cheerio';

const PopupContent: React.FC = () => {
  const [scrapedData, setScrapedData] = useState<{
    address: string;
    email: string;
    phoneNumbers: string[];
    services: string[];
    socialMediaLinks: string[];
  }>({
    address: '',
    email: '',
    phoneNumbers: [],
    services: [],
    socialMediaLinks: [],
  });
  const [showData, setShowData] = useState(false);

  const handleClickScrape = () => {
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const activeTab = tabs[0];
      const activeTabId = activeTab?.id;
      const activeTabUrl = activeTab?.url;

      if (activeTabId !== undefined && activeTabUrl) {
        chrome.scripting
          .executeScript({
            target: { tabId: activeTabId },
            func: DOMtoString,
          })
          .then((results) => {
            const htmlResult = results[0]?.result ?? '';

            const contactInfo = extractContactInfo(htmlResult, activeTabUrl);
            setScrapedData(contactInfo);
            setShowData(true);
          })
          .catch((error) => {
            console.error('Error injecting script:', error);
          });
      }
    });
  };

  function DOMtoString(selector?: string) {
    if (selector) {
      const element = document.querySelector(selector);
      if (element) return element.outerHTML;
      return 'ERROR: querySelector failed to find node';
    } else {
      return document.documentElement.outerHTML;
    }
  }

  function extractContactInfo(htmlContent: string, url: string) {
    const $ = cheerio.load(htmlContent);
    const addressElement = $('address');

    let address = '';
    let email = '';
    let phoneNumbers: string[] = [];
    let socialMediaLinks: string[] = [];
    let services: string[] = [];

    // Check if there's any address element found
    if (addressElement.length > 0) {
      const addressText = addressElement.text(); // Extract text from the address element

      // Define patterns commonly found in addresses
      const addressPatterns = [
        /\b\d+\s+\w+\s+\w+/gi, // Street address pattern (e.g., 123 Main St)
        /\b\w+\s*,\s*\w+\s*\d+/gi, // City, Postal Code pattern (e.g., City, Postal Code)
        /\b[A-Za-z\s]+,\s*[A-Za-z\s]+/gi, // City, Country pattern (e.g., City, Country)
      ];

      let extractedAddress = '';

      // Search for each pattern in the address text
      for (const pattern of addressPatterns) {
        const matches = addressText.match(pattern);
        if (matches) {
          extractedAddress += matches.join(', '); // Concatenate matches with a comma
          extractedAddress += '\n'; // Add a line break
        }
      }

      // Trim and return the extracted address
      address = extractedAddress.trim();
    }

    // Generate email regex based on the website URL
    const emailPattern = generateEmailRegex(url);

    // Iterate over all text nodes to search for potential email addresses and phone numbers
    $('*').contents().each((index, element) => {
      if (element.type === 'text') {
        const text = $(element).text();

        const matches = text.match(emailPattern);
        if (matches) {
          email = matches.join(', '); // Concatenate matches with a comma
        }

        const phonePattern = /\b\d{3}\s\d{3}\s\d{4}\b/g;
        const phoneMatches = text.match(phonePattern);
        if (phoneMatches) {
          phoneNumbers = [...phoneNumbers, ...phoneMatches];
        }

        $('a[href*=linkedin], a[href*=facebook], a[href*=twitter], a[href*=youtube]').each(function () {
          const link = $(this).attr('href') || ''; // Ensure link is always a string
          socialMediaLinks.push(link);
        });

        const servicesListItem = $('li:contains("Services")');
        if (servicesListItem.length > 0) {
          const servicesLinks = servicesListItem.find('ul a');
          servicesLinks.each(function () {
            const serviceName = $(this).text();
            services.push(serviceName);
          });
        }
      }
    });

    return { address, email, phoneNumbers, services, socialMediaLinks };
  }

  // Function to generate email regex based on the website URL
  function generateEmailRegex(url: string) {
    // Extract domain from URL
    const domain = url.split('/')[2].replace('www.', '');

    // Escape special characters in the domain
    const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Construct email regex pattern
    const emailPattern = new RegExp(`\\b[A-Za-z0-9._%+-]+@${escapedDomain}\\b`, 'g');
    return emailPattern;
  }

  return (
    <div>
      {!showData && (
        <button
          onClick={handleClickScrape}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Scrape
        </button>
      )}

      {showData && (
        <form
          className="max-w-xl mx-auto mt-8"
          method="POST"
          action="https://script.google.com/macros/s/AKfycbwuWEPL-138qfrabrDDqqGen47ZY-hp5fQYkX3FY_YOMwblM-7BlbuiZXjsXKpXgbD0/exec"
        >
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
              Address
            </label>
            <input
              name="Address"
              id="address"
              type="text"
              value={scrapedData.address}
              onChange={(e) => setScrapedData({ ...scrapedData, address: e.target.value })}
              placeholder="Enter address"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              name="Emails"
              id="email"
              type="text"
              value={scrapedData.email}
              onChange={(e) => setScrapedData({ ...scrapedData, email: e.target.value })}
              placeholder="Enter email"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phoneNumbers">
              Phone Numbers
            </label>
            <input
              name="Phone Numbers"
              id="phoneNumbers"
              type="text"
              value={scrapedData.phoneNumbers.join(',')}
              onChange={(e) => setScrapedData({ ...scrapedData, phoneNumbers: e.target.value.split(',') })}
              placeholder="Enter phone numbers"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="socialMediaLinks">
              Social Media Links
            </label>
            <input
              name="Social Media Links"
              id="socialMediaLinks"
              type="text"
              value={scrapedData.socialMediaLinks.join(',')}
              onChange={(e) => setScrapedData({ ...scrapedData, socialMediaLinks: e.target.value.split(',') })}
              placeholder="Enter social media links"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="services">
              Services
            </label>
            <input
              name="Services"
              id="services"
              type="text"
              value={scrapedData.services.join(',')}
              onChange={(e) => setScrapedData({ ...scrapedData, services: e.target.value.split(',') })}
              placeholder="Enter services"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PopupContent;
