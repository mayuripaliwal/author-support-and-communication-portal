import AdminNavbar from "./AdminNavbar"
import {Outlet} from "react-router-dom";

export default function AdminPortal() {
    return (
        <>
        <AdminNavbar/>
        <Outlet/>
        </>
    )
}