import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { getBookings } from "../features/bookings/bookings.api";
export default function BookingsPage() {
    const [items, setItems] = useState([]);
    useEffect(() => {
        getBookings().then((res) => setItems(res.data.data.items || [])).catch(() => null);
    }, []);
    return (_jsxs("main", { children: [_jsx("h2", { children: "Bookings" }), items.map((item) => (_jsxs("div", { children: [_jsx("span", { children: item.classSlot?.name || "Class" }), " - ", _jsx("span", { children: item.status })] }, item._id)))] }));
}
