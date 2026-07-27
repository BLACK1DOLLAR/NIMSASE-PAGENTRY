import SuccessClient from "./SuccessClient";

interface SuccessPageProps {
  searchParams: { reference?: string };
}

export default function VoteSuccessPage({ searchParams }: SuccessPageProps) {
  return <SuccessClient reference={searchParams.reference ?? null} />;
}
