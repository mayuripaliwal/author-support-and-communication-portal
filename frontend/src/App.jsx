import Login from "./Login"
import Signup from "./Signup"
import Books from "./Books"
import AuthorTickets from "./AuthorTickets"
import AuthorPortal from "./AuthorPortal"
import TicketForm from "./TicketForm"
import AdminTickets from "./AdminTickets"
import AdminTicketDetails from "./AdminTicketDetails"
import AuthorTicketDetails from "./AuthorTicketDetails"
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import {useState, useEffect} from "react";
import authStatus from "./authStatus";
import AdminPortal from "./AdminPortal";

function App() {
  const BACKEND_URL=import.meta.env.VITE_BACKEND_URL;
  const [auth, setAuth]=useState(authStatus.CHECKING);

  const [role, setRole]=useState("");

  const [errorMessage, setErrorMessage]=useState("");
  async function isAuthenticated(){
    setErrorMessage("");
    setAuth(authStatus.CHECKING);
    setRole("");
    try{
      const response=await fetch(`${BACKEND_URL}/auth`,{
        method:"GET",
        headers:{
          "Content-Type":"application/json"
        },
        credentials:"include",
        }
      );

      if (!response.ok){
        setAuth(authStatus.LOGGED_OUT);
      }
      else{
        const result=await response.json();
        setAuth(authStatus.LOGGED_IN);
        setRole(result["role"])
      }
    }
    catch(error){
      setErrorMessage("Something went wrong. Please try again.");
    }
  }
  useEffect(()=>{
    isAuthenticated();
  },[])
  return (
    <BrowserRouter>
    <Routes>
      {auth!=authStatus.LOGGED_IN && (
        <>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/login" element={<Login setAuth={setAuth} setAuthRole={setRole}/>}/>

        <Route path="/*" element={<Navigate to="/login" replace />} />
        </>
      )
      }
      {auth===authStatus.LOGGED_IN && (
        <>
        {role==="ADMIN" && (
          <>
          <Route element={<AdminPortal/>}>
            <Route path="/admin/tickets" element={<AdminTickets setAuth={setAuth}/>}/>
            <Route path="/admin/tickets/:ticketId" element={<AdminTicketDetails setAuth={setAuth}/>}/>
            <Route path="*" element={<Navigate to="/admin/tickets" replace />}/>
          </Route>
          </>
        )
        }
        {role==="AUTHOR" && (
          <Route element={<AuthorPortal/>}>
            <Route path="/books" element={<Books setAuth={setAuth}/>}/>
            <Route path="/tickets" element={<AuthorTickets setAuth={setAuth}/>}/>
            <Route path="/ticket-form" element={<TicketForm/>}/>
            <Route path="/tickets/:ticketId" element={<AuthorTicketDetails setAuth={setAuth}/>}/>

            <Route path="/*" element={<Navigate to="/books" replace />} />
          </Route>
        )}
        
        </>
        )
      }
    </Routes>
    </BrowserRouter>
  )
}

export default App