
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import authStatus from "./authStatus";
import { formatDate } from "./AuthorTickets";

export default function AuthorTicketDetails({ setAuth }) {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const { ticketId } = useParams();

    const [ticket, setTicket] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function fetchTicket() {
        setLoading(true);
        setErrorMessage("");

        try {
            const response = await fetch(
                `${BACKEND_URL}/tickets/${ticketId}`, { 
                    method:"GET",
                    credentials: "include" 
                }
            );

            if (response.status === 401) {
                setAuth(authStatus.LOGGED_OUT);
                return;
            }

            if (!response.ok) {
                setErrorMessage(
                    response.status === 404
                        ? "Ticket not found."
                        : "Failed to load ticket."
                );
                return;
            }

            const result = await response.json();
            setTicket(result.ticket);
        } catch (error) {
            setErrorMessage("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function sendMessage(event) {
        event.preventDefault();

        const trimmedMessage = message.trim();

        if (!trimmedMessage) {
            setErrorMessage("Message cannot be blank.");
            return;
        }

        setSending(true);
        setErrorMessage("");

        try {
            const response = await fetch(
                `${BACKEND_URL}/tickets/${ticketId}/message`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(trimmedMessage),
                }
            );

            if (response.status === 401) {
                setAuth(authStatus.LOGGED_OUT);
                return;
            }

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                setErrorMessage(
                    result.detail || "Failed to send message."
                );
                return;
            }

            setMessage("");
            await fetchTicket();
        } catch (error) {
            setErrorMessage("Something went wrong. Please try again.");
        } finally {
            setSending(false);
        }
    }

    useEffect(() => {
        fetchTicket();
    }, [ticketId]);

    if (loading) {
        return <p className="p-6 text-center">Loading ticket...</p>;
    }

    if (!ticket) {
        return (
            <div className="mx-auto max-w-3xl p-6">
                {errorMessage && (
                    <p className="text-sm text-red-600">{errorMessage}</p>
                )}
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl p-6">

            <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex flex-wrap justify-between gap-3">
                    <h1 className="text-xl font-semibold text-gray-900">
                        {ticket.subject}
                    </h1>
                    <span className="h-fit rounded-full bg-gray-100 px-3 py-1 text-sm">
                        {ticket.status}
                    </span>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                    Ticket #{ticket.ticket_id} · {formatDate(ticket.created_at)}
                </p>

                <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {ticket.description}
                </p>
            </div>

            <section className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900">
                    Conversation
                </h2>

                {!ticket.responses?.length ? (
                    <p className="mt-4 text-sm text-gray-500">
                        No replies yet. Send a message to contact support.
                    </p>
                ) : (
                    <div className="mt-4 space-y-4">
                        {ticket.responses.map((item) => (
                            <div
                                key={item.ticket_message_id}
                                className={`rounded-lg border p-4 ${
                                    item.sender_type === "Author"
                                        ? "border-indigo-100 bg-indigo-50"
                                        : "border-gray-200 bg-white"
                                }`}
                            >
                                <div className="flex justify-between gap-3">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {item.sender_type === "Admin"
                                            ? "BookLeaf Support"
                                            : "You"}
                                    </span>
                                    <time className="text-xs text-gray-500">
                                        {formatDate(item.created_at)}
                                    </time>
                                </div>

                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                    {item.body}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="mt-8 border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900">
                    Reply to Support
                </h2>

                <form onSubmit={sendMessage} className="mt-3">
                    <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        rows={4}
                        maxLength={5000}
                        required
                        placeholder="Write your message..."
                        className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />

                    {errorMessage && (
                        <p role="alert" className="mt-2 text-sm text-red-600">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={sending || !message.trim()}
                        className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {sending ? "Sending..." : "Send Message"}
                    </button>
                </form>
            </section>
        </div>
    );
}
