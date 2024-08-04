import { TxSearch } from "@/components/views/tx-search";

export default function Home() {
  return (
    <>
      <h1 className="font-bold my-6">SimpleScan</h1>
      <div className="w-full md:w-1/2">
        <TxSearch />
      </div>
    </>
  );
}
