import React from "react";
import { useNavigate } from "react-router-dom";
import picture3 from "./picture3.png";
import zenil from "./zenil.jpeg";
import ammarimage from "./ammarimage.png"
import ustavimage from "./utsavimage.jpeg"
import nishthaimage from "./nishthaimage.jpeg"
import bhavya from "./bhavyaimage.jpeg"

export default function LandingPage() {
  const navigate = useNavigate();

  const handleLearnMoreClick = () => {
    navigate("/job_description"); // Navigate to job description on button click
  };

  return (
    <div>
      <header className="text-gray-600 body-font bg-indigo-500">
        <div className="container mx-auto flex flex-wrap flex-col md:flex-row items-center">
          <button
            className="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0"
            onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span
              className="ml-3 text-xl"
              style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '2rem',
                WebkitTextStroke: '3px #E5E7EB',
                WebkitTextFillColor: '#6366F1',
              }}
            >
              LOGO
            </span>
          </button>
          <nav className="md:ml-auto md:mr-auto flex flex-wrap items-center text-base justify-center space-x-8">
            <button
              className="inline-flex items-center bg-indigo-500 text-white font-bold text-xl border-0 py-2 px-6 focus:outline-none hover:underline hover:bg-transparent"
              onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Home
            </button>
            <button
              className="inline-flex items-center bg-indigo-500 text-white font-bold text-xl border-0 py-2 px-6 focus:outline-none hover:underline hover:bg-transparent"
              onClick={() => document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Our Team
            </button>
            <button
              className="inline-flex items-center bg-indigo-500 text-white font-bold text-xl border-0 py-2 px-6 focus:outline-none hover:underline hover:bg-transparent"
              onClick={() => document.getElementById('Aboutus')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Working
            </button>
            <button
              className="inline-flex items-center bg-indigo-500 text-white font-bold text-xl border-0 py-2 px-6 focus:outline-none hover:underline hover:bg-transparent"
              onClick={() => document.getElementById('contactus')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Contact Us
            </button>
          </nav>
        </div>
      </header>
  
      <section className="relative w-full h-1/2 bg-transparent mt-32" id="home">
      <div className="absolute inset-0 flex justify-center items-center z-20">
        <div className="text-center text-indigo-500 max-w-2xl">
          <h1 className="title-font sm:text-5xl text-4xl mb-6 font-medium">
            <b>Talent Acquisition Platform</b>
          </h1>
        </div>
      </div>
    </section>





<section className="text-gray-600 body-font" id="Aboutus">
    <div className="container px-2 py-24 mx-auto flex flex-wrap pb-0 mb-0 "> {/* Removed margin and padding on bottom here */}
        <div className="flex flex-wrap w-full">
            <div className="lg:w-2/5 md:w-1/2 md:pr-10 md:py-6">
                <div className="flex relative pb-12">
                    <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                        <div className="h-full w-1 bg-indigo-200 pointer-events-none"></div>
                    </div>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 inline-flex items-center justify-center text-white relative z-10">
                        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M16 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H16c1.1 0 1.99-.9 1.99-2V4c0-1.1-.89-2-1.99-2zM16 20H6V4h10v16z"></path>
                        </svg>
                    </div>
                    <div className="flex-grow pl-4">
                        <h2 className="font-medium title-font text-sm text-gray-900 mb-1 tracking-wider">STEP 1</h2>
                        <p className="leading-relaxed">Define the job requirements based on the qualifications and experience sought in candidates' resumes.</p>
                    </div>
                </div>

                <div className="flex relative pb-12">
                    <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                        <div className="h-full w-1 bg-indigo-200 pointer-events-none"></div>
                    </div>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 inline-flex items-center justify-center text-white relative z-10">
                        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M12 3v12h6l-7 7-7-7h6V3h2z"></path>
                        </svg>
                    </div>
                    <div className="flex-grow pl-4">
                        <h2 className="font-medium title-font text-sm text-gray-900 mb-1 tracking-wider">STEP 2</h2>
                        <p className="leading-relaxed">Upload the resumes of potential candidates for evaluation and shortlisting.</p>
                    </div>
                </div>

                <div className="flex relative pb-12">
                    <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                        <div className="h-full w-1 bg-indigo-200 pointer-events-none"></div>
                    </div>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 inline-flex items-center justify-center text-white relative z-10">
                        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M5 12l5 5L19 7"></path>
                        </svg>
                    </div>
                    <div className="flex-grow pl-4">
                        <h2 className="font-medium title-font text-sm text-gray-900 mb-1 tracking-wider">STEP 3</h2>
                        <p className="leading-relaxed">Review and shortlist candidates based on their resumes, then send them an email with the test link for further evaluation.</p>
                    </div>
                </div>

                <div className="flex relative pb-12">
                    <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                        <div className="h-full w-1 bg-indigo-200 pointer-events-none"></div>
                    </div>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 inline-flex items-center justify-center text-white relative z-10">
                        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22 2H2v20h20V2zM2 2l20 20"></path>
                        </svg>
                    </div>
                    <div className="flex-grow pl-4">
                        <h2 className="font-medium title-font text-sm text-gray-900 mb-1 tracking-wider">STEP 4</h2>
                        <p className="leading-relaxed">Conduct a comprehensive MCQ-based assessment of the shortlisted candidates to evaluate their skills and suitability.</p>
                    </div>
                </div>

                <div className="flex relative pb-12">
                    <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                        <div className="h-full w-1 bg-indigo-200 pointer-events-none"></div>
                    </div>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 inline-flex items-center justify-center text-white relative z-10">
                        {/* Profile Icon for Step 5 */}
                        <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                            <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="13" stroke="white" strokeWidth="2" fill="none" />
                                <circle cx="12" cy="9" r="2" fill="white" />
                                <path d="M12 14c-4 0-6 3-6 3h12s-2-3-6-3z" fill="white" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex-grow pl-4">
                        <h2 className="font-medium title-font text-sm text-gray-900 mb-1 tracking-wider">STEP 5</h2>
                        <p className="leading-relaxed">Candidates who successfully pass the MCQ test should proceed to the interview stage, where they will interact with an AI-powered bot for further assessment.</p>
                    </div>
                </div>

                <div className="flex relative pb-12">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 inline-flex items-center justify-center text-white relative z-10">
                        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                            <path d="M22 4L12 14.01l-3-3"></path>
                        </svg>
                    </div>
                    <div className="flex-grow pl-4">
                        <h2 className="font-medium title-font text-sm text-gray-900 mb-1 tracking-wider">Finish</h2>
                        <p className="leading-relaxed">The interview process is now complete, and final decisions can be made based on the interview performance.</p>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center w-full lg:w-3/5 md:w-1/2 mt-12 md:mt-0">
                <img
                    className="object-cover object-center rounded-lg"
                    src={picture3}
                    alt="step"
                    style={{ width: '100%', height: '500px', objectFit: 'cover' }} // Set desired height here
                />
                <div className="w-full flex justify-center mt-8">
                <button
                    onClick={handleLearnMoreClick}
                    className="inline-flex items-center bg-indigo-500 text-white border-0 py-2 px-6 focus:outline-none hover:bg-white hover:text-indigo-500 rounded text-lg transition-all duration-300 ease-in-out"
                >
                    Click for Demo
                </button>

                </div>
            </div>
        </div>
    </div>
</section>

<section className="text-gray-600 body-font bg-indigo-500" id="team">
  <div className="container px-5 py-24 mx-auto pt-0 mt-1">
    <div className="flex flex-col text-center w-full mb-20">
      <h1 className="sm:text-5xl text-4xl font-extrabold title-font mb-1 mt-5 text-gray-300">Our Team</h1>
    </div>
    <div className="flex justify-between flex-wrap">
      <div className="p-2 w-1/5">
        <div className="h-full flex items-center bg-gray-300 border-gray-200 border p-6 rounded-lg">
          <img alt="team" className="w-16 h-16 bg-gray-100 object-cover object-center flex-shrink-0 rounded-full mr-4" src={ammarimage} />
          <div className="flex-grow">
            <h2 className="text-gray-700 title-font font-medium text-lg font-bold">Ammar</h2>
            <p className="text-gray-500 text-base">CTO</p>
          </div>
        </div>
      </div>
      <div className="p-2 w-1/5">
        <div className="h-full flex items-center bg-gray-300 border-gray-200 border p-6 rounded-lg">
          <img alt="team" className="w-16 h-16 bg-gray-100 object-cover object-center flex-shrink-0 rounded-full mr-4" src={bhavya} />
          <div className="flex-grow">
            <h2 className="text-gray-700 title-font font-medium text-lg font-bold">Bhavya</h2>
            <p className="text-gray-500 text-base">UI/UX</p>
          </div>
        </div>
      </div>
      <div className="p-2 w-1/5">
        <div className="h-full flex items-center bg-gray-300 border-gray-200 border p-6 rounded-lg">
          <img alt="team" className="w-16 h-16 bg-gray-100 object-cover object-center flex-shrink-0 rounded-full mr-4" src={nishthaimage} />
          <div className="flex-grow">
            <h2 className="text-gray-700 title-font font-medium text-lg font-bold">Nishtha</h2>
            <p className="text-gray-500 text-base">UI/UX</p>
          </div>
        </div>
      </div>
      <div className="p-2 w-1/5">
        <div className="h-full flex items-center bg-gray-300 border-gray-200 border p-6 rounded-lg">
          <img alt="team" className="w-16 h-16 bg-gray-100 object-cover object-center flex-shrink-0 rounded-full mr-4" src={zenil} />
          <div className="flex-grow">
            <h2 className="text-gray-700 title-font font-medium text-lg font-bold">Zenil</h2>
            <p className="text-gray-500 text-base">UI/UX</p>
          </div>
        </div>
      </div>
      <div className="p-2 w-1/5">
        <div className="h-full flex items-center bg-gray-300 border-gray-200 border p-6 rounded-lg">
          <img alt="team" className="w-16 h-16 bg-gray-100 object-cover object-center flex-shrink-0 rounded-full mr-4" src={ustavimage} />
          <div className="flex-grow">
            <h2 className="text-gray-700 title-font font-medium text-lg font-bold">Utsav</h2>
            <p className="text-gray-500 text-base">UI/UX</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      <section className="text-gray-600 body-font relative" id="contactus">
        <div className="container px-5 py-24 mx-auto pt-0 mt-5">
        <div className="flex flex-col text-center w-full mb-12">
            <b><h1 className="sm:text-4xl text-3xl font-large title-font mb-4 mt-5 text-indigo-500">Contact Us</h1></b>
            <p className="lg:w-2/3 mx-auto leading-relaxed text-base">
                Have questions? Reach out to us and we’ll be happy to help!
            </p>
            </div>


          <div className="lg:w-1/2 md:w-2/3 mx-auto">
            <div className="flex flex-wrap -m-2">
              <div className="p-2 w-1/2">
                <div className="relative">
                  <label htmlFor="name" className="leading-7 text-sm text-gray-600">Name</label>
                  <input type="text" id="name" name="name" className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
                </div>
              </div>
              <div className="p-2 w-1/2">
                <div className="relative">
                  <label htmlFor="email" className="leading-7 text-sm text-gray-600">Email</label>
                  <input type="email" id="email" name="email" className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
                </div>
              </div>
              <div className="p-2 w-full">
                <div className="relative">
                  <label htmlFor="message" className="leading-7 text-sm text-gray-600">Message</label>
                  <textarea id="message" name="message" className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 h-32 text-base outline-none text-gray-700 py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out"></textarea>
                </div>
              </div>
              <div className="p-2 w-full">
                <button className="flex mx-auto text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg">Submit</button>
              </div>
              <div className="p-2 w-full pt-8 mt-8 border-t border-gray-200 text-center">
              <a className="text-indigo-500" href="mailto:ammarkarimi@gmail.com?subject=Subject&body=Hello%20Ammar">
                ammarkarimi@gmail.com
              </a>
                <p className="leading-normal my-5">49 Smith St.
                  <br />Saint Cloud, MN 56301
                </p>
                <span className="inline-flex">
                  <button 
                    className="text-gray-500 hover:text-indigo-500" 
                    onClick={() => console.log('Facebook clicked')}
                    aria-label="Facebook"
                  >
                    <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                    </svg>
                  </button>
                  <button 
                    className="ml-4 text-gray-500 hover:text-indigo-500" 
                    onClick={() => console.log('Twitter clicked')}
                    aria-label="Twitter"
                  >
                    <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                    </svg>
                  </button>
                  <button 
                    className="ml-4 text-gray-500 hover:text-indigo-500" 
                    onClick={() => console.log('Instagram clicked')}
                    aria-label="Instagram"
                  >
                    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01"></path>
                    </svg>
                  </button>
                  <button 
                    className="ml-4 text-gray-500 hover:text-indigo-500" 
                    onClick={() => console.log('Messenger clicked')}
                    aria-label="Messenger"
                  >
                    <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path>
                    </svg>
                  </button>
                </span>

              </div>
            </div>
          </div>
        </div>
      </section>
{/* 
      <footer className="text-gray-600 body-font">
        <div className="container px-5 py-24 mx-auto flex md:items-center lg:items-start md:flex-row md:flex-nowrap flex-wrap flex-col">
          <div className="w-64 flex-shrink-0 md:mx-0 mx-auto text-center md:text-left">
            <a className="flex title-font font-medium items-center md:justify-start justify-center text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-10 h-10 text-white p-2 bg-indigo-500 rounded-full" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span className="ml-3 text-xl">Tailblocks</span>
            </a>
            <p className="mt-2 text-sm text-gray-500">Air plant banjo lyft occupy retro adaptogen indego</p>
          </div>
          <div className="flex-grow flex flex-wrap md:pl-20 -mb-10 md:mt-0 mt-10 md:text-left text-center">
            <div className="lg:w-1/4 md:w-1/2 w-full px-4">
              <h2 className="title-font font-medium text-gray-900 tracking-widest text-sm mb-3">CATEGORIES</h2>
              <nav className="list-none mb-10">
                <li>
                  <a className="text-gray-600 hover:text-gray-800">First Link</a>
                </li>
                <li>
                  <a className="text-gray-600 hover:text-gray-800">Second Link</a>
                </li>
                <li>
                  <a className="text-gray-600 hover:text-gray-800">Third Link</a>
                </li>
                <li>
                  <a className="text-gray-600 hover:text-gray-800">Fourth Link</a>
                </li>
              </nav>
            </div>
            <div className="lg:w-1/4 md:w-1/2 w-full px-4">
              <h2 className="title-font font-medium text-gray-900 tracking-widest text-sm mb-3">CATEGORIES</h2>
              <nav className="list-none mb-10">
                <li>
                  <a className="text-gray-600 hover:text-gray-800">First Link</a>
                </li>
                <li>
                  <a className="text-gray-600 hover:text-gray-800">Second Link</a>
                </li>
                <li>
                  <a className="text-gray-600 hover:text-gray-800">Third Link</a>
                </li>
                <li>
                  <a className="text-gray-600 hover:text-gray-800">Fourth Link</a>
                </li>
              </nav>
            </div>
            <div className="lg:w-1/4 md:w-1/2 w-full px-4">
              <h2 className="title-font font-medium text-gray-900 tracking-widest text-sm mb-3">CATEGORIES</h2>
              <nav className="list-none mb-10">
                <li>
                  <a className="text-gray-600 hover:text-gray-800">First Link</a>
                </li>
                <li>
                  <a className="text-gray-600 hover:text-gray-800">Second Link</a>
                </li>
                <li>
                  <a className="text-gray-600 hover:text-gray-800">Third Link</a>
                </li>
                <li>
                  <a className="text-gray-600 hover:text-gray-800">Fourth Link</a>
                </li>
              </nav>
            </div>
            <div className="lg:w-1/4 md:w-1/2 w-full px-4">
              <h2 className="title-font font-medium text-gray-900 tracking-widest text-sm mb-3">CATEGORIES</h2>
              <nav className="list-none mb-10">
                <li>
                  <a className="text-gray-600 hover:text-gray-800">First Link</a>
                </li>
                <li>
                  <a className="text-gray-600 hover:text-gray-800">Second Link</a>
                </li>
                <li>
                  <a className="text-gray-600 hover:text-gray-800">Third Link</a>
                </li>
                <li>
                  <a className="text-gray-600 hover:text-gray-800">Fourth Link</a>
                </li>
              </nav>
            </div>
          </div>
        </div>
        <div className="bg-gray-100">
          <div className="container mx-auto py-4 px-5 flex flex-wrap flex-col sm:flex-row">
            <p className="text-gray-500 text-sm text-center sm:text-left">© 2020 Tailblocks —
              <a href="https://twitter.com/knyttneve" rel="noopener noreferrer" className="text-gray-600 ml-1" target="_blank">@knyttneve</a>
            </p>
            <span className="inline-flex sm:ml-auto sm:mt-0 mt-2 justify-center sm:justify-start">
              <a className="text-gray-500">
                <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                </svg>
              </a>
              <a className="ml-3 text-gray-500">
                <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                </svg>
              </a>
              <a className="ml-3 text-gray-500">
                <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01"></path>
                </svg>
              </a>
              <a className="ml-3 text-gray-500">
                <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path>
                </svg>
              </a>
            </span>
          </div>
        </div>
      </footer> */}
    </div>
  );
}