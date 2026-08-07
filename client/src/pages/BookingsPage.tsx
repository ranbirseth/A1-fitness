import { useEffect, useState } from "react";
import { getBookings } from "../features/bookings/bookings.api";

type Booking = { _id: string; status: string; classSlot?: { name?: string } };

export default function BookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);

  useEffect(() => {
    getBookings().then((res) => setItems(res.data.data.items || [])).catch(() => null);
  }, []);

  return (
    <main>
      <h2>Bookings</h2>
      {items.map((item) => (
        <div key={item._id}>
          <span>{item.classSlot?.name || "Class"}</span> - <span>{item.status}</span>
        </div>
      ))}
    </main>
  );
}
