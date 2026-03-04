/**
 * Hero Heading
 * "Stop Guessing - Start Living: Your New Life is a Click Away"
 * Displayed above the globe and Paragraphical button.
 */

import './HeroHeading.css';

export function HeroHeading() {
  return (
    <div className="hero-heading">
      <h1 className="hero-heading__title">
        <span className="hero-heading__emphasis">Stop Guessing</span>
        <span className="hero-heading__separator"> — </span>
        <span className="hero-heading__emphasis">Start Living</span>
      </h1>
      <p className="hero-heading__subtitle">
        Your New Life is a Click Away
      </p>
    </div>
  );
}
