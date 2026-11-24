import { permanentRedirect } from "next/navigation";

/** Legacy alias — listings are managed on the public /my-ads page. */
export default function DashboardListingsPage() {
  permanentRedirect("/my-ads");
}
