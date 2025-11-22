"use client";

import Image from "next/image";
import App from "./components/App";
import { XIcon } from "./components/icons/XIcon";
import { LinkedInIcon } from "./components/icons/LinkedInIcon";
import { FacebookIcon } from "./components/icons/FacebookIcon";
import GitHubButton from "react-github-btn";


const Home = () => {
  return (
    <>
      <div className="h-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-b from-black/50 to-black/10 backdrop-blur-[2px] h-[4rem] flex items-center">
          <header className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 flex items-center justify-between">
            <div>
              <a className="flex items-center" href="/">
                {/* Clean header without branding */}
                <div className="text-white text-xl font-bold">
                  🎯 Speech Tools
                </div>
              </a>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="mt-1">
                <GitHubButton
                  href="https://github.com/your-username/speech-tools"  // Update to your repo
                  data-color-scheme="no-preference: light; light: light; dark: light;"
                  data-size="large"
                  data-show-count="true"
                  aria-label="Star speech tools on GitHub"
                >
                  Star
                </GitHubButton>
              </span>
            </div>
          </header>
        </div>

        {/* Main Content */}
        <main className="mx-auto px-4 md:px-6 lg:px-8 h-[calc(100%-4rem)] -mb-[4rem]">
          <App />
        </main>

        {/* Footer */}
        <div className="bg-black/80 h-[4rem] flex items-center absolute w-full">
          <footer className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 flex items-center justify-center gap-4 md:text-xl font-inter text-[#8a8a8e]">
            <span className="text-base text-[#4e4e52]">share it</span>
            <a
              href="#"
              onClick={(e) => {
                window.open(
                  "https://twitter.com/intent/tweet?text=%F0%9F%94%A5%20Check%20out%20this%20awesome%20Speech%20Tools%20app%20for%20Text-to-Speech%20and%20Speech-to-Text%0A%0A%20https%3A//your-app-url.com",  // Update URL
                  "",
                  "_blank, width=600, height=500, resizable=yes, scrollbars=yes"
                );

                return e.preventDefault();
              }}
              aria-label="share on twitter"
              target="_blank"
            >
              <XIcon className="mb-1" />
            </a>
            <a
              href="#"
              onClick={(e) => {
                window.open(
                  "https://www.linkedin.com/shareArticle?mini=true&url=https%3A//your-app-url.com&title=Speech%20Tools%20-%20Text-to-Speech%20%26%20Speech-to-Text",  // Update URL and title
                  "",
                  "_blank, width=600, height=500, resizable=yes, scrollbars=yes"
                );

                return e.preventDefault();
              }}
              aria-label="share on Linkedin"
            >
              <LinkedInIcon className="mb-1" />
            </a>
            <a
              href="#"
              onClick={(e) => {
                window.open(
                  "https://www.facebook.com/sharer/sharer.php?u=https%3A//your-app-url.com",  // Update URL
                  "",
                  "_blank, width=600, height=500, resizable=yes, scrollbars=yes"
                );

                return e.preventDefault();
              }}
              target="_blank"
              aria-label="share on Facebook"
            >
              <FacebookIcon className="mb-1" />
            </a>
            <div className="border-l border-[#4e4e52] w-px h-7">&nbsp;</div>
            <a
              className="text-base font-semibold"
              href="mailto:your-email@example.com"  // Your contact email
              target="_blank"
            >
              contact us
            </a>
          </footer>
        </div>

        {/* Remove the powered by badge completely */}
      </div>
    </>
  );
};

export default Home;