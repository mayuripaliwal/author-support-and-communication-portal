import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { PlusIcon } from '@heroicons/react/20/solid'
import {NavLink} from "react-router-dom";
 
export default function AuthorNavbar() {
  return (
    <Disclosure as="nav" className="relative bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="mr-2 -ml-2 flex items-center md:hidden">
              {/* Mobile menu button */}
              <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden focus:ring-inset">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open main menu</span>
                <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
              </DisclosureButton>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <NavLink
                to="/books"
                className={({ isActive }) =>
                `inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                isActive
                    ? "border-indigo-600 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`
            }
              >
                My Books
              </NavLink>
              <NavLink
                to="/tickets"
                className={({ isActive }) =>
                    `inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    isActive
                        ? "border-indigo-600 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`
                }
              >
                My Tickets
              </NavLink>
            </div>
          </div>
          <div className="flex items-center">
            <div className="shrink-0">
              <NavLink
                to="/ticket-form"
                className="relative inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon aria-hidden="true" className="-ml-0.5 size-5" />
                Submit a Ticket
              </NavLink>
            </div>
            <div className="hidden md:ml-4 md:flex md:shrink-0 md:items-center">

            </div>
          </div>
        </div>
      </div>

      <DisclosurePanel className="md:hidden">
        <div className="space-y-1 pt-2 pb-3">
          <DisclosureButton
            as={NavLink}
            to="/books"
            className={({ isActive }) =>
            `block border-l-4 py-2 pr-4 pl-3 text-base font-medium sm:pr-6 sm:pl-5 ${
            isActive
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
            }`
        }
          >
            My Books
          </DisclosureButton>
          <DisclosureButton
            as={NavLink}
            to="/tickets"
            className={({ isActive }) =>
            `block border-l-4 py-2 pr-4 pl-3 text-base font-medium sm:pr-6 sm:pl-5 ${
            isActive
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
            }`
        }
          >
            My Tickets
          </DisclosureButton>
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
