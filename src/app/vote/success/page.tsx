import SuccessClient from "./SuccessClient";

interface SuccessPageProps {
  searchParams: { reference?: string; trxref?: string };
}

export default function VoteSuccessPage({ searchParams }: SuccessPageProps) {
  return <SuccessClient reference={searchParams.reference ?? searchParams.trxref ?? null} />;
}
