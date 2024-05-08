import React, { useEffect, useState } from 'react';
import cheerio from 'cheerio';

const PopupContent: React.FC = () => {
  const [socialMediaLinks, setSocialMediaLinks] = useState<string[]>([]);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const activeTab = tabs[0];
      const activeTabId = activeTab?.id;

      if (activeTabId !== undefined) {
        chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          func: DOMtoString,
        }).then(results => {
          const htmlResult = results[0]?.result ?? '';
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
      <h1>Social Media Links</h1>
      <ul>
        {socialMediaLinks.map((link, index) => (
          <li key={index}><a href={link} target="_blank" rel="noopener noreferrer">{link}</a></li>
        ))}
      </ul>
    </div>
  );
};

export default PopupContent;
