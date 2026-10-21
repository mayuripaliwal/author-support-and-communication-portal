import {useState, useEffect} from "react";
import authStatus from "./authStatus";
import { Link } from "react-router-dom";

export function formatDate(date) {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
export default function AuthorTickets({setAuth}) {
  const [loading, setLoading]=useState(false);
  const [tickets, setTickets]=useState([]);

   const [errorMessage, setErrorMessage]=useState("");

  async function fetchAllTickets(){
    const BACKEND_URL=import.meta.env.VITE_BACKEND_URL;
    setLoading(true);
    try{
      const response=await fetch(`${BACKEND_URL}/tickets`,{
        method:"GET",
        credentials:"include",
        headers:{
          "Content-Type":"application/json"
        }
      });

      if (response.ok){
        const result=await response.json();
        setTickets(result["tickets"]);
      }
      else if (response.status===404){
        setErrorMessage("No tickets found");
      }
      else if (response.status===401){
        setAuth(authStatus.LOGGED_OUT)
      }
      else {
        setErrorMessage("Something went wrong. Please try again");
      }
    }
    catch(error){
      setErrorMessage("Something went wrong. Please try again");
    }
    finally{
      setLoading(false);
    }
  }

  useEffect(()=>{
    fetchAllTickets()
  },[]);

  return (
    <>
    {loading && (
      <p className="mt-4 text-center text-sm text-gray-600">
        Loading tickets...
      </p>
    )}

    {errorMessage && (
      <p className="mt-4 text-center text-sm text-red-600">
        {errorMessage}
      </p>
      )
    }
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
    <ul role="list" className="divide-y divide-gray-100">
      {tickets.length>0 && tickets.map((ticket) => (
        
        <li key={ticket.ticket_id} className="py-4 sm:py-5">
        <details
        className="group rounded-lg border border-gray-200 p-3 sm:p-5"
        >
        <summary
        className="flex cursor-pointer list-none items-start justify-between gap-3"
        >
          <div className="flex min-w-0 gap-x-4">
            <div className="min-w-0 flex-auto">
              <Link 
              to={`/tickets/${ticket.ticket_id}`}
              className="mt-3 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-500"
              >
                {ticket.subject}
              </Link>
              <div className="text-xs font-semibold text-gray-600">
                <p className="text-sm text-gray-500">
                  Ticket #{ticket.ticket_id}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(ticket.created_at)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-x-4">
            <div className="hidden sm:flex sm:flex-col sm:items-end">
              <span className="shrink-0 text-sm">
                {ticket.status}
              </span>
            </div>
          </div>
        </summary>
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
          {ticket.description}
          </p>
        </div>
        {ticket.responses.length === 0 ? (
          <p className="text-sm text-gray-500">
            No responses yet. We'll update you here when someone
            replies.
          </p>
          ) : (
          <div className="space-y-3">
            {ticket.responses.map((message) => (
              <div
                key={message.ticket_message_id}
                className="rounded-lg bg-gray-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-800">
                    {message.sender_type === "Admin"
                      ? "Support Team"
                      : "You"}
                  </span>

                  <span className="text-xs text-gray-500">
                    {formatDate(message.created_at)}
                  </span>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  {message.body}
                </p>
              </div>
            ))}
            </div>
            )
        }
        </details>
        </li>
      
      ))}
    </ul>
    </div>
    </>
  )
}
