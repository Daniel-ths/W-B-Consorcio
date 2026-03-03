"use client";

import { useParams } from "next/navigation";
import ChevroletNavbar from "@/components/tenant/ChevroletNavbar";
import HyundaiNavbar from "@/components/tenant/HyundaiNavbar";

export default function TenantNavbar() {
  const params = useParams();
  const brand = String(params?.brand || "chevrolet");
  if (brand === "hyundai") return <HyundaiNavbar />;
  return <ChevroletNavbar />;
}