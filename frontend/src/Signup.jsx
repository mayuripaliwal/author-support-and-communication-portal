import {useState} from "react";
import {Link} from "react-router-dom";

export default function Signup() {
    const BACKEND_URL=import.meta.env.VITE_BACKEND_URL;

    const [userName, setUserName]=useState("")
    const [userEmail, setUserEmail]=useState("")
    const [userPhone, setUserPhone]=useState("")
    const [userCity, setUserCity]=useState("")
    const [userPassword, setUserPassword]=useState("")

    const [errorMessage, setErrorMessage]=useState("");

    const [success, setSuccess]=useState(false);

    const [loading, setLoading]=useState(false);

    async function handleSubmit(event){
        event.preventDefault();

        setLoading(true);
        setSuccess(false);
        setErrorMessage("");

        const payload={
          name:userName.trim(),
          email:userEmail.trim(),
          password:userPassword,
          phone:userPhone.trim() || null,
          city:userCity.trim() || null
        };

        try{
          const response=await fetch(`${BACKEND_URL}/signup`,{
            method:"POST",
            headers:{
              "Content-Type":"application/json"
            },
            body:JSON.stringify(payload),
          })

          if (response.ok){
            setSuccess(true);
          }
          else if (response.status===409){
            setErrorMessage("An account with this email already exists.");
          }
          else if (response.status===422){
            setErrorMessage("Invalid input.");
            /*#TODO: handle showing apt message for what kind of invalid input it is */
          }
          else {
            setErrorMessage("Something went wrong. Please try again.");
          }
        }
        catch (e){
          setErrorMessage("Something went wrong. Please try again.");
        }
        finally{
          setLoading(false);
        }
    }

  return (
    <>
      {!success && 
        (<div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
              Create your BookLeaf account today!
            </h2>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
            <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12">
              <form onSubmit={handleSubmit} method="POST" className="space-y-6">
                  <div>
                      <label htmlFor="name" className="block text-sm/6 font-medium text-gray-900">
                      Name <span>*</span>
                      </label>
                      <div className="mt-2">
                      <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          autoComplete="name"
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                          value={userName}
                          onChange={(e)=>setUserName(e.target.value)}
                      />
                      </div>
                  </div>
                <div>
                  <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                    Email address <span>*</span>
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
                    Password <span>*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      value={userPassword}
                      onChange={(e)=>setUserPassword(e.target.value)}
                    />
                  </div>
                </div>

                  <div>
                      <label htmlFor="phone" className="block text-sm/6 font-medium text-gray-900">
                      Phone
                      </label>
                      <div className="mt-2">
                      <input
                          id="phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                          value={userPhone}
                          onChange={(e)=>setUserPhone(e.target.value)}
                      />
                      </div>
                  </div>
                  <div>
                      <label htmlFor="city" className="block text-sm/6 font-medium text-gray-900">
                      City
                      </label>
                      <div className="mt-2">
                      <input
                          id="city"
                          name="city"
                          type="text"
                          autoComplete="address-level2"
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                          value={userCity}
                          onChange={(e)=>setUserCity(e.target.value)}
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
                    {loading ? "Creating account...": "Sign Up"}
                  </button>
                </div>
              </form>
            </div>

            <p className="mt-10 text-center text-sm/6 text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
        <p className="mt-8 text-center text-xl text-green-600">
          Account created successfully.
        </p>
        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <Link
            to="/login"
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Login
          </Link>
        </div>
        </div>
      )}
    </>
  )
}
