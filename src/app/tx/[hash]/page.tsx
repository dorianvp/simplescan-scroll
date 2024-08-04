import { Chat } from "@/components/views/chat";

export default function TxPage({ params }: { params: { hash: string } }) {
	return (
		<div className="h-full w-full flex flex-col justify-start items-center overflow-hidden">
			<h1 className="flex text-xl font-bold my-5 text-ellipsis text-nowrap">Transaction: {params.hash}</h1>
			<Chat txHash={params.hash} />
		</div>
	);
}