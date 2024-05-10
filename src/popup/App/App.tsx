import React, { useState } from 'react';
import PopupContent from './PopupContent';

function App() {
  const [scraped, setScraped] = useState(false);

  const handleScrape = () => {
    setScraped(true);
  };

  return (
    <div className="App min-h-screen bg-gray-100 flex justify-center items-center">
      <button onClick={handleScrape} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600">Scrape</button>
      {scraped && <PopupContent />}
    </div>
  );
}

export default App;
