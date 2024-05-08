// PopupContent.tsx

import React, { useEffect, useState } from 'react';

const PopupContent: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>('');

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
          setHtmlContent(htmlResult);
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

  return (
    <div>
      <h1>Page Source</h1>
      <pre>{htmlContent}</pre>
    </div>
  );
};

export default PopupContent;
