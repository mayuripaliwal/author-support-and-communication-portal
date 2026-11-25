import {Link} from "react-router-dom";
import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Demo Video', href: '#demo' },
  { name: 'Features', href: '#features' },
  { name: 'About', href: '#about' },
]

const features = [
  {
    title: "AI-Powered Ticket Classification",
    description: "Automatically categorize incoming author queries and assign priority levels to help administrators organize support requests."
  },
  {
    title: "AI-Assisted Responses",
    description: "Generate context-aware response drafts using ticket details, recent conversation history, and the publishing knowledge base."
  },
  {
    title: "Ticket Management",
    description: "Administrators can claim tickets, update their category, priority, and status, and manage author support requests."
  },
  {
    title: "Centralized Communication",
    description: "Keep author queries and administrator responses organized in a single conversation thread."
  },
  {
    title: "Private Internal Notes",
    description: "Allow administrators to add private notes to tickets without exposing internal discussions to authors."
  },
  {
    title: "Author Book Management",
    description: "Authors can view their books, check publishing information, and raise book-specific or general support requests."
  }
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <Link
            to="/"
            className="text-xl text-gray-900"
          >
            AuthorConnect
          </Link>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-500"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <a key={item.name} href={item.href} className="text-sm/6 font-semibold text-gray-900">
                {item.name}
              </a>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <Link
            to="/login"
            className="flex gap-1 justify items-center rounded-md text-sm font-semibold text-gray-900"
          >
            Log in
            <span aria-hidden="true">&rarr;</span>
          </Link>
          </div>
        </nav>
        <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
          <div className="fixed inset-0 z-50" />
          <DialogPanel className="bg-white fixed inset-y-0 right-0 z-50 w-full overflow-y-auto p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="text-xl text-gray-900"
              >
                AuthorConnect
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={()=>setMobileMenuOpen(false)}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
                <div className="py-6">
                  <Link
                    to="/login"
                    className="flex gap-1 justify items-center rounded-md text-sm font-semibold text-gray-900"
                  >
                    Log in
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>

      <div className="relative isolate min-h-screen overflow-hidden pt-14">
        
        <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >

        <div className="absolute -top-40 right-[-8rem] h-[32rem] w-[32rem] rounded-full bg-blue-200/50 blur-3xl" />

        <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
            backgroundImage: `
                linear-gradient(to right, #94a3b8 1px, transparent 1px),
                linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)"
            }}
        />
        </div>

        <div className="relative z-10 pt-24 sm:pt-32 lg:pb-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid mx-auto max-w-7xl items-center gap-16 lg:grid-cols-2">
              {/**CTA */}
              <div className="max-w-2xl">
                <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
                  Resolve author queries faster.
                </h1>
                <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
                  AuthorConnect lets support teams handle queries faster with AI ticket classification and prioritization.
                </p>
                <div className="mt-10 flex items-left justify-left gap-x-6">
                  <Link
                    to="/signup"
                    className="relative z-10 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Get started
                  </Link>
                  <a
                    href="#demo"
                    className="relative z-10 rounded-md border border-gray-900 px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-xs hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Watch Demo
                  </a>
                </div>
              </div>

                <div className="relative mx-auto w-full max-w-2xl pb-12 sm:pb-16">
                    <img
                    src="/AuthorConnect_Demo_Screenshot.png"
                    className="relative z-20 w-[85%] rounded-xl shadow-2xl ring-1 ring-gray-900/10"
                    />
                    <img
                    src="/AuthorConnect_Demo_TicketHistory_Screenshot.png"
                    className="relative z-30 ml-auto -mt-16 w-[72%] rounded-xl shadow-2xl ring-1 ring-gray-900/10 sm:-mt-28"
                    />
                    <img
                    src="/AuthorConnect_Demo_MyBooks_Screenshot.png"
                    className="absolute bottom-0 left-0 z-10 w-[48%] rounded-xl shadow-xl ring-1 ring-gray-900/10"
                    />

                </div>
                           
            </div>
          </div>
        </div>
      </div>
      {/**Video Demo */}
      <section className="relative z-10 px-6 sm:py-8">
        <div className="mx-auto max-w-7xl">
          <div  id="demo" className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              See AuthorConnect in action
            </h2>

            <p className="mt-4 text-lg text-gray-600">
              Follow an author's support request from submission to an AI-assisted administrator response.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-xl bg-gray-900 shadow-xl ring-1 ring-gray-900/10">
            <video
              controls
              preload="metadata"
              playsInline
              className="h-auto w-full"
              poster="/AuthorConnect_Demo_Screenshot.png"
            >
              <source src="/AuthorConnect_Demo_Video.mp4" type="video/mp4" />
              Your browser does not support the video element.
            </video>
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            Video product walkthrough demonstrating the author and admin workflows.
          </p>
        </div>
      </section>
      {/**Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 pt-10 lg:px-8 lg:pt-4">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-gray-900">
          Features
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(function(feature,index){
            return(
            <article key={feature.title}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                {feature.description}
              </p>
            </article>
            )
          })}
        </div>
      </section>
      <footer id="about" className="px-6 mt-20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-gray-500 sm:flex-row lg:px-8 py-1">
          <p>
            Built with ❤️ by <a 
              href="https://github.com/mayuripaliwal"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
            > 
              Mayuri Paliwal
            </a>
          </p>
          <a 
            href="https://github.com/mayuripaliwal/author-support-and-communication-portal"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
