import React, { useEffect, useState } from 'react';
import cheerio from 'cheerio';

const PopupContent: React.FC = () => {
  const [address, setAddress] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [socialMediaLinks, setSocialMediaLinks] = useState<string[]>([]);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const activeTab = tabs[0];
      const activeTabId = activeTab?.id;
      const activeTabUrl = activeTab?.url;

      if (activeTabId !== undefined && activeTabUrl) {
        chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          func: DOMtoString,
        }).then(results => {
          const htmlResult = results[0]?.result ?? '';

          const contactInfo = extractContactInfo(htmlResult, activeTabUrl);
          setAddress(contactInfo.address);
          setEmail(contactInfo.email);
          setPhoneNumbers(contactInfo.phoneNumbers);

          const extractedServices = extractServices(htmlResult);
          setServices(extractedServices);

          const contacts = extractSocialMediaLinks(htmlResult);
          setSocialMediaLinks(contacts);
        }).catch(error => {  
          console.error('Error injecting script:', error);
        });
      }
    });
  }, []);

  function DOMtoString(selector?: string) {
    if (selector) {
      const element = document.querySelector(selector);
      if (element) return element.outerHTML;
      return "ERROR: querySelector failed to find node";
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

    // Check if there's any address element found
    if (addressElement.length > 0) {
      const addressText = addressElement.text(); // Extract text from the address element

      // Define patterns commonly found in addresses
      const addressPatterns = [
        /\b\d+\s+\w+\s+\w+/gi, // Street address pattern (e.g., 123 Main St)
        /\b\w+\s*,\s*\w+\s*\d+/gi, // City, Postal Code pattern (e.g., City, Postal Code)
        /\b[A-Za-z\s]+,\s*[A-Za-z\s]+/gi // City, Country pattern (e.g., City, Country)
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
      }
    });

    return { address, email, phoneNumbers };
  }

  // Function to generate email regex based on the website URL
  function generateEmailRegex(url: string) {
    // Extract domain from URL
    const domain = url.split('/')[2].replace('www.', '');
    console.log(domain);

    // Construct email regex pattern
    const emailPattern = new RegExp(`\\b[A-Za-z0-9._%+-]+@${domain}\\b`, 'g');
    console.log(emailPattern);
    return emailPattern;
  }

  function extractServices(htmlContent: string) {
    const $ = cheerio.load(htmlContent);
    const services: string[] = [];

    // Find the <li> element containing "Services"
    const servicesListItem = $('li:contains("Services")');
    if (servicesListItem.length > 0) {
      // Get all <a> elements under the services <ul>
      const servicesLinks = servicesListItem.find('ul a');
      servicesLinks.each(function () {
        const serviceName = $(this).text();
        services.push(serviceName);
      });
    }

    return services;
  }

  function extractSocialMediaLinks(htmlContent: string) {
    const $ = cheerio.load(htmlContent);
    const contacts: string[] = [];
    $('a[href*=linkedin], a[href*=facebook], a[href*=twitter], a[href*=youtube]').each(function () {
      const link = $(this).attr('href') || ''; // Ensure link is always a string
      contacts.push(link);
    });
    return contacts;
  }

  return (
    <div>
      <h1>Address</h1>
      <p>{address}</p>

      <h1>Email</h1>
      <p>{email}</p>

      <h1>Phone Numbers</h1>
      <ul>
        {phoneNumbers.map((phoneNumber, index) => (
          <li key={index}>{phoneNumber}</li>
        ))}
      </ul>

      <h1>Social Media Links</h1>
      <ul>
        {socialMediaLinks.map((link, index) => (
          <li key={index}><a href={link} target="_blank" rel="noopener noreferrer">{link}</a></li>
        ))}
      </ul>

      <h1>Services</h1>
      <ul>
        {services.map((service, index) => (
          <li key={index}>{service}</li>
        ))}
      </ul>
    </div>
  );
};

export default PopupContent;
