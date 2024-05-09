import React, { useState } from 'react';
import PopupContent from './PopupContent';

function App() {
  const [scraped, setScraped] = useState(false);

  const handleScrape = () => {
    setScraped(true);
  };

  return (
    <div className="App min-h-screen bg-gray-100 flex justify-center items-center">
      <form 
        method="POST" 
        action="https://script.google.com/macros/s/AKfycbwuWEPL-138qfrabrDDqqGen47ZY-hp5fQYkX3FY_YOMwblM-7BlbuiZXjsXKpXgbD0/exec"
      >
        <input name="Email" type="email" placeholder="Email" required />
        <input name="Name" type="text" placeholder="Name" required />
        <button type="submit">Send</button>
      </form>
      <button onClick={handleScrape} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600">Scrape</button>
      {scraped && <PopupContent />}
    </div>
  );
}

export default App;
