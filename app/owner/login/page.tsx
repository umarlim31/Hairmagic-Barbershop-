import type { Metadata } from "next";
import { OwnerLogin } from "./form";
export const metadata: Metadata = { title: "Masuk Owner | Hairmagic", robots: { index: false, follow: false } };
export default function LoginPage() { return <OwnerLogin />; }
