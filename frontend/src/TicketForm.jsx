import {PaperClipIcon } from '@heroicons/react/24/solid'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import {useState, useEffect} from "react";
import authStatus from "./authStatus";

function TicketForm({setAuth}) {
    const BACKEND_URL=import.meta.env.VITE_BACKEND_URL;
    const [books, setBooks]=useState([]);
    const [loading, setLoading]=useState(false);

    const [queryType, setQueryType]=useState("");
    const [subject, setSubject]=useState("");
    const [description, setDescription]=useState("");

    const [errorMessage, setErrorMessage]=useState("");

    const [success, setSuccess]=useState(false);

    async function fetchAllBooks(){
        setLoading(true);
        setBooks([]);
        setErrorMessage("");
        try{
            const response = await fetch(`${BACKEND_URL}/author/books?published_only=False`,{
                method:"GET",
                headers:{
                    "Content-Type":"application/json"
                },
                credentials:"include"
            });

            if (response.ok){
                const result=await response.json();
                setBooks(result["books"]);
            }
            else if (response.status===401){
                setAuth(authStatus.LOGGED_OUT);
            }
            else{
                setErrorMessage("Something went wrong. Please try again");
            }
        }
        catch (error){
            setErrorMessage("Something went wrong. Please try again");
        }
        finally{
            setLoading(false);
        }
    }
    async function handleSubmit(event){
        event.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setSuccess(false);

        const payload={
          "book_id":queryType===""?null:queryType,
          "subject":subject,
          "description":description
        }

        try{
            /*TODO: implement API query fetch here */
            const response=await fetch(`${BACKEND_URL}/tickets`,{
              method:"POST",
              credentials:"include",
              headers:{
                "Content-Type":"application/json"
              },
              body:JSON.stringify(payload)
            })

            if (response.ok){
              const result=await response.json();
              setSuccess(true);
            }
            else if (response.status===403){
              setErrorMessage("Action not allowed.");
            }
            else if (response.status===404){
              setErrorMessage("Selected book does not exist.");
            }
            else{
              setErrorMessage("Something went wrong. Please try again.");
            }
        }
        catch(error){
            setErrorMessage("Something went wrong. Please try again.");
        }
        finally{
            setLoading(false);
        }
    }
    useEffect(()=>{
      fetchAllBooks()
    },[])
  return (
    <>
      {!success && (
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 mt-4 ">
         <form onSubmit={handleSubmit}>
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900">Support Query Form</h2>
          <p className="mt-1 text-sm/6 text-gray-600">
            Please fill this form to raise a ticket.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">

            <div className="sm:col-span-3">
              <label htmlFor="queryType" className="block text-sm/6 font-medium text-gray-900">
                Query Type
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="queryType"
                  name="queryType"
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  value={queryType}
                  onChange={(e)=>setQueryType(e.target.value)}
                >
                  <option
                  value=""
                  >
                    General / Account Level
                  </option>
                  {books.map((book)=>(
                    <option 
                      key={book.book_id} 
                      value={book.book_id}
                    >
                    {book.title}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="subject" className="block text-sm/6 font-medium text-gray-900">
                Subject
              </label>
              <div className="mt-2">
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  autoComplete="subject"
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  value={subject}
                  onChange={(e)=>setSubject(e.target.value)}
                />
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="description" className="block text-sm/6 font-medium text-gray-900">
                Description
              </label>
              <div className="mt-2">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  required
                  value={description}
                  onChange={(e)=>setDescription(e.target.value)}
                />
              </div>
              <p className="mt-3 text-sm/6 text-gray-600">Please describe your issue in detail.</p>
            </div>

            <div className="col-span-full">
              <label htmlFor="file" className="block text-sm/6 font-medium text-gray-900">
                Attach File
              </label>
              <div className="mt-2 flex items-center gap-x-3">
                <PaperClipIcon aria-hidden="true" className="size-6 text-gray-300" />
                <button
                  type="button"
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end pb-6 gap-x-6">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
          Submit
        </button>
        </div>
    </form>
    </div>
  )}
    <p className="mt-4 text-center text-sm text-red-600">
      {errorMessage}
    </p>
    {
      success && (
        <p className="mt-4 text-center text-m text-gray-600">
          Ticket submitted successfuly.
        </p>
      )
    }
    </>
  )
}

export default TicketForm