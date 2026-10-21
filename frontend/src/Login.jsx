import {Link, useNavigate} from "react-router-dom";
import {useState} from "react";
import authStatus from "./authStatus";

export default function Login({setAuth, setAuthRole}) {
  const BACKEND_URL=import.meta.env.VITE_BACKEND_URL;
  
  const [userEmail, setUserEmail]=useState("")
  const [userPassword, setUserPassword]=useState("")

  const [errorMessage, setErrorMessage]=useState("");

  const [success, setSuccess]=useState(false);

  const [loading, setLoading]=useState(false);
  const navigate=useNavigate();

  const [role, setRole]=useState("AUTHOR");

  async function handleSubmit(event){
    event.preventDefault();

    setLoading(true);
    setSuccess(false);
    setErrorMessage("");

    const payload={
      "role":role,
      "email":userEmail.trim(),
      "password":userPassword
    }

    try{
      const response=await fetch(`${BACKEND_URL}/login`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        credentials:"include",
        body:JSON.stringify(payload),
      });

      if (response.ok){
        setAuth(authStatus.LOGGED_IN);
        setRole(role);
        setAuthRole(role);
        setSuccess(true);
        if (role==="AUTHOR"){
          navigate("/books");
        }
        else if (role==="ADMIN"){
          navigate("/admin/tickets");
        }
      }
      else if (response.status===401){
        setErrorMessage("Invalid email or password.");
        setAuth(authStatus.LOGGED_OUT);
      }
      else if (response.status===422){
        setErrorMessage("Invalid input.");
      }
      else{
        setErrorMessage("Something went wrong. Please try again.");
        setAuth(authStatus.LOGGED_OUT);
      }
    }
    catch(error){
      setErrorMessage("Something went wrong. Please try again.");
      setAuth(authStatus.LOGGED_OUT);
    }
    finally{
      setLoading(false);
    }
  }
  
  return (
    <>
      {!success && (
        <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
              Sign in to your BookLeaf account
            </h2>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
            <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12">
              <form onSubmit={handleSubmit} method="POST" className="space-y-6">
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm/6 font-medium text-gray-900"
                  >
                    Sign in as
                  </label>

                  <div className="mt-2">
                    <select
                      id="role"
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 sm:text-sm/6"
                    >
                      <option value="AUTHOR">Author</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                    Email address
                  </label>
                  <div className="mt-2">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      value={userEmail}
                      onChange={(e)=>setUserEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                    Password
                  </label>
                  <div className="mt-2">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      value={userPassword}
                      onChange={(e)=>setUserPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/*Error message */}
                {errorMessage && (
                  <p className="mt-4 text-center text-sm text-red-600">
                    {errorMessage}
                  </p>
                )
                }

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    {loading?"Signing in...": "Sign in"}
                  </button>
                </div>
              </form>
            </div>

            <p className="mt-10 text-center text-sm/6 text-gray-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
        <p className="mt-8 text-center text-xl text-green-600">
          Login successful.
        </p>
        </div>
      )}
    </>
  )
}
