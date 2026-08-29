import { redirect } from "next/navigation";

/** The site has five pages and About is the front door. */
export default function CoachIndex() {
  redirect("/coach/about");
}
