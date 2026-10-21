import authStatus from "./authStatus";
import {useNavigate, useParams} from "react-router-dom";
import {useState, useEffect, useCallback, useRef} from "react";
import usePolling from "./usePolling";

export default function AdminTicketDetails({setAuth }) {
    const BACKEND_URL=import.meta.env.VITE_BACKEND_URL;
    const {ticketId}=useParams();
    
    const navigate=useNavigate();

    const [loading, setLoading]=useState(true);

    const [errorMessage, setErrorMessage]=useState("");

    const [ticket, setTicket]=useState(null);

    const [category, setCategory] = useState("");
    const [priority, setPriority] = useState("");
    const [status, setStatus] = useState("");

    const [saving, setSaving] = useState(false);

    const [updatingTicket, setUpdatingTicket]=useState(false);

    const [savingInternalNote,setSavingInternalNote]=useState(false);

    const [newInternalNote, setNewInternalNote] = useState("");

    const [newMessage,setNewMessage]=useState("");

    const [savingNewMessage, setSavingNewMessage]=useState(false);

    const [generatingReply, setGeneratingReply] = useState(false);

    const categories = [
        "Royalty & Payments",
        "ISBN & Metadata Issues",
        "Printing & Quality",
        "Distribution & Availability",
        "Book Status & Production Updates",
        "General Inquiry",
    ];

    const priorities = ["Critical", "High", "Medium", "Low"];

    const statuses=["Open", "In Progress", "Resolved", "Closed"];

    const formEdited = useRef(false);

    const getTicketDetails=useCallback(async ()=>{
        setErrorMessage("");
        try{
            const response= await fetch(`${BACKEND_URL}/admin/tickets/${ticketId}`,{
                "method":"GET",
                "credentials":"include",
                "headers":{
                    "Content-Type":"application/json"
                }
            });

            if (response.ok){
                const result=await response.json();
                
                const data= result["ticket"];
                
                setTicket(result["ticket"]);
                
                if (!formEdited.current) {
                    setStatus(data.status);
                    setCategory(data.category ?? "");
                    setPriority(data.priority ?? "");
                }
                
            }
            else if (response.status===404){
                setErrorMessage("Ticket does not exist");
            }
            else{
                setErrorMessage("Something went wrong. Please try again");
            }
        }
        catch(error){
            setErrorMessage("Something went wrong. Please try again");
        }
        finally{
            setLoading(false);
        }
    },[BACKEND_URL, ticketId, setAuth])

    async function updateTicket() {
        setUpdatingTicket(true);
        const payload={
            category, priority, status
        }
        try {
            const response = await fetch(
                `${BACKEND_URL}/admin/tickets/${ticketId}`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body:JSON.stringify(payload)
                }
            );

            if (response.ok) {
                formEdited.current = false;
                await getTicketDetails();
            } 
            else {
                setErrorMessage("Failed to update ticket. Please try again.");
            }
        } 
        catch (error) {
            setErrorMessage("Something went wrong. Please try again");
        } 
        finally {
            setUpdatingTicket(false);
        }
    }

    async function assignToMe(){
        setSaving(true);
        try {
            const response = await fetch(
                `${BACKEND_URL}/admin/tickets/${ticketId}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    }
                }
            );

            if (response.ok) {
                 await getTicketDetails();
            } 
            else if (response.status === 409) {
                // Another admin may have assigned it first.
                await getTicketDetails();
            } 
            else if (response.status === 401) {
                setAuth(authStatus.LOGGED_OUT);
            } 
            else {
                setErrorMessage("Failed to assign ticket. Please try again.");
            }
        } 
        catch (error) {
            setErrorMessage("Something went wrong. Please try again");
        } 
        finally {
            setSaving(false);
        }
    }

    async function saveInternalNote(event){
        event.preventDefault();
        
        const new_internal_note=newInternalNote.trim();

        if (!new_internal_note){
            setErrorMessage("Internal note cannot be blank.");
            return;
        }

        setSavingInternalNote(true);
        setErrorMessage("");
        try {
            const response = await fetch(
                `${BACKEND_URL}/admin/tickets/${ticketId}/internal_note`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body:JSON.stringify(new_internal_note)
                }
            );

            if (response.ok) {
                setNewInternalNote("");
                await getTicketDetails();
            } 
            else {
                setErrorMessage("Failed to add ticket note. Please try again.");
            }
        } 
        catch (error) {
            setErrorMessage("Something went wrong. Please try again");
        } 
        finally {
            setSavingInternalNote(false);
        }
    }

    async function saveMessage(event){
        event.preventDefault();

        const new_message=newMessage.trim();

        if (!new_message){
            setErrorMessage("Message cannot be blank");
            return;
        }

        setSavingNewMessage(true);
        setErrorMessage("");
        try {
            const response = await fetch(
                `${BACKEND_URL}/admin/tickets/${ticketId}/message`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body:JSON.stringify(new_message)
                }
            );

            if (response.ok) {
                setNewMessage("");
                await getTicketDetails();
            } 
            else {
                setErrorMessage("Failed to send message. Please try again.");
            }
        } 
        catch (error) {
            setErrorMessage("Something went wrong. Please try again");
        } 
        finally {
            setSavingNewMessage(false);
        }
    }

    
    async function generateAIReply() {
        setGeneratingReply(true);
        setErrorMessage("");

        try {
            const response = await fetch(
                `${BACKEND_URL}/admin/tickets/${ticketId}/generate-reply`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 401) {
                setAuth(authStatus.LOGGED_OUT);
                return;
            }

            const result = await response.json();

            if (!response.ok) {
                setErrorMessage(
                    result.detail || "Failed to generate AI reply. Please try again."
                );
                return;
            }

            if (
                typeof result.draft !== "string" ||
                !result.draft.trim()
            ) {
                setErrorMessage("The AI returned an empty reply.");
                return;
            }

            setNewMessage(result.draft);
        } catch (error) {
            setErrorMessage(
                "Unable to generate an AI reply. Please try again."
            );
        } finally {
            setGeneratingReply(false);
        }
    }


    usePolling(getTicketDetails, 5000);

    return (
        <>
        {loading && (
            <p className="py-6 text-center text-sm text-gray-600">
                Loading ticket...
            </p>
        )}

        {errorMessage &&(
            <p className="py-6 text-center text-sm text-red-600">
                {errorMessage}
            </p>
        )}

        {ticket &&
        (
        <div className="mx-auto max-w-6xl px-4 py-5 min-h-screen sm:px-6">
            <div className="px-4 sm:px-0">
                <h1 className="text-base/7 font-semibold text-gray-900">
                    Ticket Information
                </h1>
                <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">
                    Details and conversation for ticket #{ticket.ticket_id}.
                </p>
            </div>

            <div className="mt-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2">
                    <div className="border-t border-gray-100 px-4 py-6 sm:px-0">
                        <dt className="text-sm/6 font-medium text-gray-900">
                            Ticket ID
                        </dt>
                        <dd className="mt-1 text-sm/6 text-gray-700 sm:mt-2">
                            {ticket.ticket_id}
                        </dd>
                    </div>

                    <div className="border-t border-gray-100 px-4 py-6 sm:px-0">
                        <dt className="text-sm/6 font-medium text-gray-900">
                            Created At
                        </dt>
                        <dd className="mt-1 text-sm/6 text-gray-700 sm:mt-2">
                            {new Date(ticket.created_at).toLocaleString()}
                        </dd>
                    </div>

                    <div className="border-t border-gray-100 px-4 py-6 sm:px-0">
                        <dt className="text-sm/6 font-medium text-gray-900">
                            Author ID
                        </dt>
                        <dd className="mt-1 text-sm/6 text-gray-700 sm:mt-2">
                            {ticket.author_id}
                        </dd>
                    </div>

                    <div className="border-t border-gray-100 px-4 py-6 sm:px-0">
                        <dt className="text-sm/6 font-medium text-gray-900">
                            Book ID
                        </dt>
                        <dd className="mt-1 text-sm/6 text-gray-700 sm:mt-2">
                            {ticket.book_id ?? "Not associated with a book"}
                        </dd>
                    </div>

                    <div className="border-t border-gray-100 px-4 py-6 sm:col-span-2 sm:px-0">
                        <dt className="text-sm/6 font-medium text-gray-900">
                            Subject
                        </dt>
                        <dd className="mt-1 text-sm/6 font-semibold text-gray-900 sm:mt-2">
                            {ticket.subject}
                        </dd>
                    </div>

                    <div className="border-t border-gray-100 px-4 py-6 sm:col-span-2 sm:px-0">
                        <dt className="text-sm/6 font-medium text-gray-900">
                            Description
                        </dt>
                        <dd className="mt-1 whitespace-pre-wrap text-sm/6 text-gray-700 sm:mt-2">
                            {ticket.description}
                        </dd>
                    </div>
                </dl>
                
                <div className="mt-8 border-t border-gray-200 pt-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Update Ticket
                    </h2>

                    {/* Assignment */}
                    <div>
                        <label className="mt-4 block text-sm font-medium text-gray-700">
                            Assigned Admin
                        </label>

                        <div className="mt-2 flex items-center gap-3">
                            <span className="text-sm text-gray-900">
                                {ticket.assigned_admin_id ?? "Unassigned"}
                            </span>

                            {!ticket.assigned_admin_id && (
                                <button
                                    type="button"
                                    onClick={assignToMe}
                                    disabled={saving}
                                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {saving ? "Assigning..." : "Assign to me"}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                        {/* Category */}
                        <div>
                            <label
                                htmlFor="category"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Category
                            </label>

                            <select
                                id="category"
                                value={category}
                                onChange={(e) => {
                                    formEdited.current = true;
                                    setCategory(e.target.value)
                                }}
                                className="mt-2 block w-full rounded-md border-0 py-2 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                            >
                                {categories.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label
                                htmlFor="priority"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Priority
                            </label>

                            <select
                                id="priority"
                                value={priority}
                                onChange={(e) => {
                                    formEdited.current = true;
                                    setPriority(e.target.value)
                                }}
                                className="mt-2 block w-full rounded-md border-0 py-2 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                            >
                                {priorities.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label
                                htmlFor="status"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Status
                            </label>

                            <select
                                id="status"
                                value={status}
                                onChange={(e) => {
                                    formEdited.current = true;
                                    setStatus(e.target.value)
                                }}
                                className="mt-2 block w-full rounded-md border-0 py-2 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                            >
                                {statuses.map((item)=>(
                                    <option
                                        key={item}
                                        value={item}
                                    >
                                    {item}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={updateTicket}
                            disabled={updatingTicket}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {updatingTicket ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
                <div className="mt-4 flex items-start space-x-4">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Add Internal Note
                        </h2>
                        <form onSubmit={saveInternalNote} className="mt-2 relative">
                        <div className="rounded-lg bg-white outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                            <label htmlFor="comment" className="sr-only">
                            Add a new note
                            </label>
                            <textarea
                            id="comment"
                            name="comment"
                            rows={3}
                            placeholder="Add a new note..."
                            value={newInternalNote}
                            onChange={(e)=>setNewInternalNote(e.target.value)}
                            className="block w-full resize-none bg-transparent px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                            required
                            />

                            {/* Spacer element to match the height of the toolbar */}
                            <div aria-hidden="true" className="py-2">
                            {/* Matches height of button in toolbar (1px border + 36px content height) */}
                            <div className="py-px">
                                <div className="h-9" />
                            </div>
                            </div>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 flex justify-between py-2 pr-2 pl-3">
                            
                            <div className="shrink-0">
                            <button
                                type="submit"
                                disabled={savingInternalNote}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                {savingInternalNote ? "Adding..." : "Add"}
                            </button>
                            </div>
                        </div>
                        </form>
                    </div>
                </div>
                <div className="mt-4 flex items-start space-x-4">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Send a message to Author
                        </h2>
                        <form onSubmit={saveMessage} className="mt-2 relative">
                        <div className="rounded-lg bg-white outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                            <label htmlFor="comment" className="sr-only">
                            Add message here
                            </label>
                            <textarea
                            id="comment"
                            name="comment"
                            rows={3}
                            placeholder="Add message here..."
                            value={newMessage}
                            onChange={(e)=>setNewMessage(e.target.value)}
                            className="block w-full resize-none bg-transparent px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                            required
                            />

                            {/* Spacer element to match the height of the toolbar */}
                            <div aria-hidden="true" className="py-2">
                            {/* Matches height of button in toolbar (1px border + 36px content height) */}
                            <div className="py-px">
                                <div className="h-9" />
                            </div>
                            </div>
                        </div>

                        
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 py-2 pr-2 pl-3">
                            <button
                                type="button"
                                onClick={generateAIReply}
                                disabled={generatingReply || savingNewMessage}
                                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {generatingReply ? "Generating..." : "Generate AI Reply"}
                            </button>

                            <button
                                type="submit"
                                disabled={savingNewMessage || generatingReply}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {savingNewMessage ? "Sending..." : "Send"}
                            </button>
                        </div>

                        </form>
                    </div>
                </div>  
                <div className="mt-8 border-t border-gray-200 pt-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Ticket History
                    </h2>

                    {ticket.responses.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-500">
                            No messages in this conversation yet.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-4">
                            {ticket.responses.map((message) => (
                                <div
                                    key={message.ticket_message_id}
                                    className={`rounded-lg border p-4 ${
                                        message.visibility === "Private"
                                            ? "border-amber-300 bg-amber-50"
                                            : "border-gray-200 bg-white"
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {message.sender_type}
                                            </span>

                                            {message.visibility === "Private" && (
                                                <span className="rounded-full bg-amber-200 px-2 py-1 text-xs font-medium text-amber-900">
                                                    Internal note · Admin only
                                                </span>
                                            )}
                                        </div>

                                        <time className="text-xs text-gray-500">
                                            {new Date(
                                                message.created_at
                                            ).toLocaleString()}
                                        </time>
                                    </div>

                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                        {message.body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                

            </div>
        </div>
    )}
    </>
    );
}

