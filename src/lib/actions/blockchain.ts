'use server'

import { createPublicClient, getContract, http } from "viem";
import { scroll } from "viem/chains";

const SCROLLSCAN_KEY = process.env.SCROLLSCAN_KEY;

const scrollClient = createPublicClient({
	chain: scroll,
	transport: http("https://rpc.scroll.io/")
})

// export async function getContractName(address: string) {
// 	const sourceCode = await fetch(
// 		`https://api.scrollscan.com/api
// 		?module=contract
// 		&action=getsourcecode
// 		&address=${address}
// 		&apikey=${SCROLLSCAN_KEY}`
// 	).then(response => response.json())
// 	console.log(sourceCode.result[0]);

// 	return sourceCode.result[0].ContractName
// }

export async function getContractName(address: string): Promise<string> {
	try {

		const abi = await getContractAbi(address)
		console.log(abi);

		const data = await scrollClient.readContract({
			address: address as `0x${string}`,
			abi: abi,
			functionName: 'name',
			args: []
		}) as string
		console.log("DATA", data);
		return data.toString();
	} catch (error) {
		console.log("Contract has no name() function");
		return "";
	}
}
export async function getContractAbi(address: string) {
	const abi = await fetch(
		`https://api.scrollscan.com/api?module=contract
		&action=getabi
		&address=${address}
		&apikey=${SCROLLSCAN_KEY}`
	).then(response => response.json())
	return abi
}

export async function isContract(address: string) {
	const source = await scrollClient.getCode({
		address: address as `0x${string}`,
	})
	if (source && source.length > 2) {
		console.log("CONTRACT DETECTED");

		return true
	}
	return false
}