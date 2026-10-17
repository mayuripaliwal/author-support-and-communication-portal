import {useEffect, useState} from "react";

export default function Books() {
    const BACKEND_URL=import.meta.env.VITE_BACKEND_URL;

    const [books, setBooks]=useState([]);
    const [loading, setLoading]=useState(false);
    const [errorMessage, setErrorMessage]=useState("");
    async function fetchBooks(){
        setLoading(true);
        setBooks([]);
        try{
            const response = await fetch(`${BACKEND_URL}/author/books`,{
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
    useEffect(()=>{
        fetchBooks()
    },[]
    )
  return (
    <main className="min-h-screen bg-[#F8F7F4] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">

        {books.length>0 && (
            <ul
            role="list"
            className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
            {books.map((book) => (
                <li className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5 transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50/80 p-5">
                        <div className="min-w-0 flex-1">
                        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700 ring-1 ring-green-600/20">
                            <span className="size-1.5 rounded-full bg-green-600" />
                            {book.status}
                        </span>

                        <h3 className="font-serif text-lg font-semibold leading-snug text-gray-900">
                            {book.title}
                        </h3>

                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                            {book.genre}
                        </p>
                        </div>
                    </div>

                    {/* Publishing details */}
                    <dl className="divide-y divide-gray-100 px-5">
                        <div className="flex items-start justify-between gap-4 py-3">
                        <dt className="shrink-0 text-sm text-gray-500">ISBN</dt>
                        <dd className="min-w-0 break-words text-right text-sm font-medium text-gray-900">
                            {book.isbn}
                        </dd>
                        </div>

                        <div className="flex items-start justify-between gap-4 py-3">
                        <dt className="shrink-0 text-sm text-gray-500">Publication date</dt>
                        <dd className="min-w-0 break-words text-right text-sm font-medium text-gray-900">
                            {book.publication_date}
                        </dd>
                        </div>

                        <div className="flex items-start justify-between gap-4 py-3">
                        <dt className="shrink-0 text-sm text-gray-500">MRP</dt>
                        <dd className="min-w-0 break-words text-right text-sm font-medium text-gray-900">
                            INR {book.mrp}
                        </dd>
                        </div>
                    </dl>

                    {/* Sales and royalties */}
                    <div className="border-t border-gray-100 p-5">
                        <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                        Sales & royalties
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Copies sold</p>
                            <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900">
                            {book.total_copies_sold}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Total earned</p>
                            <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900">
                            INR {book.total_royalty_earned}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-100 p-3">
                            <p className="text-xs text-gray-500">Royalty paid</p>
                            <p className="mt-1 text-base font-semibold tabular-nums text-gray-800">
                            INR {book.royalty_paid}
                            </p>
                        </div>

                        <div className="rounded-xl bg-[#EDF3E9] p-3 ring-1 ring-[#DDE8D6]">
                            <p className="text-xs text-[#52664A]">Royalty pending</p>
                            <p className="mt-1 text-base font-bold tabular-nums text-[#36552D]">
                            INR {book.royalty_pending}
                            </p>
                        </div>
                        </div>
                    </div>
                    </li>
            ))}
            </ul>
        )}

        {/*Loading message */}
        {loading && (
            <p className="mt-4 text-center text-sm text-gray-600">
                Loading books...
            </p>
        )}

        {/*Error message */}
        {errorMessage && (
            <p className="mt-4 text-center text-sm text-red-600">
                {errorMessage}
            </p>
        )}
      </div>
    </main>
  );
}
