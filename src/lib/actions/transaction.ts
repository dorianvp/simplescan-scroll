'use server'

import { FormSchema } from "@/components/views/tx-search";
import { redirect } from "next/navigation";
import { z } from "zod";
import OpenAI from 'openai'
import Anthropic from "@anthropic-ai/sdk";

import { createPublicClient, http, Transaction, TransactionNotFoundError } from 'viem'
import { bsc, mainnet, scroll, zetachain } from 'viem/chains'
import { getContractName, isContract } from "./blockchain";

const OPENAI_KEY = process.env.OPENAI_KEY;
const CLAUDE_KEY = process.env.CLAUDE_KEY;
const ALCHEMY_RPC_URL = process.env.ALCHEMY_RPC_URL;
const BLOCKPI_RPC_URL = process.env.BLOCKPI_RPC_URL;
const BLOCKPI_LCD_URL = process.env.BLOCKPI_LCD_URL;
const ALCHEMY_ETH_URL = process.env.ALCHEMY_ETH_URL;
const BSC_RPC_URL = process.env.BSC_RPC_URL;

export type CCTX = {
	creator: string;
	index: string;
	zeta_fees: string;
	relayed_message: string;
	cctx_status: object;
	inbound_tx_params: Transaction & {
		sender_chain_id: string;
		inbound_tx_observed_hash: string;
	},
	outbound_tx_params: Transaction & {
		receiver_chainId: string;
		outbound_tx_hash: string;
	}[];
}

const zetaClient = createPublicClient({
	chain: zetachain,
	transport: http(ALCHEMY_RPC_URL)
})

const scrollClient = createPublicClient({
	chain: scroll,
	transport: http("https://rpc.scroll.io/")
})
// const ethClient = createPublicClient({
// 	chain: mainnet,
// 	transport: http(ALCHEMY_ETH_URL)
// })
// const bscClient = createPublicClient({
// 	chain: bsc,
// 	transport: http(BSC_RPC_URL)
// })

export async function analyzeTx(data: z.infer<typeof FormSchema>) {
	redirect('/tx/' + data.txHash);
}

export async function generateResponse(messages: { role: "user" | "assistant", content: string }[], prompt: string) {

	const openai = new OpenAI({
		// baseURL: 'http://localhost:11434/v1',
		apiKey: OPENAI_KEY, // required but unused
	})
	const anthropic = new Anthropic({
		apiKey: CLAUDE_KEY
	});

	const completion = await anthropic.messages.create({
		model: "claude-3-5-sonnet-20240620",
		max_tokens: 1024,
		messages: [
			...messages,
			{
				role: "user",
				content: prompt
			}
		],
	});

	// const c = await openai.chat.completions.create({
	// 	model: 'gpt-4o',
	// 	messages: [
	// 		...messages,
	// 		{ role: 'user', content: prompt }
	// 	],
	// })

	return {
		data: completion
	}
}

export async function generateInitialResponse({ txData }: { txData: string }) {
	// const openai = new OpenAI({
	// 	// baseURL: 'http://localhost:11434/v1',
	// 	apiKey: OPENAI_KEY, // required but unused
	// })

	const anthropic = new Anthropic({
		apiKey: CLAUDE_KEY
	});

	const completion = await anthropic.messages.create({
		model: "claude-3-5-sonnet-20240620",
		max_tokens: 1024,
		system: getPrompt(txData),
		messages: [{
			role: "user",
			content: `Here is the transaction: ${JSON.stringify(txData)}`
		}],
	});

	console.log(txData);

	return [
		{
			data: `Here is the transaction: ${JSON.stringify(txData)}`
		},
		{
			data: completion
		}
	]
}

async function fetchCCTXData(txHash: string): Promise<CCTX> {
	try {

		const data = await fetch(`${BLOCKPI_LCD_URL}/zeta-chain/crosschain/cctx/${txHash}`, { cache: 'no-store' })
			.then((response) => {
				return response
			}).then((response) => {
				return response.json()
			})
			.catch((error) => {
				console.log(error);
			})

		// Fetch data from inbound and outbound TXs
		return data.CrossChainTx;
	} catch (error) {
		console.log(error);
		return {} as CCTX;
	}
}

export async function getTxData(txHash: string): Promise<Transaction | CCTX | string | { [key: string]: any }> {
	let data: Transaction | CCTX | { [key: string]: any };
	let status = {}
	let contractName = ""
	let txData: { [key: string]: any } | string = {};
	try {
		data = await scrollClient.getTransaction({
			hash: txHash as `0x${string}`,
		})
		console.log(data);


		status = await scrollClient.getTransactionReceipt({
			hash: txHash as `0x${string}`,
		})

		if (await isContract(data.to as string)) {
			contractName = await getContractName(data.to as string)
		}

		// Transaction is on Zeta
		//@ts-ignore
		data.status = status.status.toString().toUpperCase();
		//@ts-ignore
		data.contractName = contractName
		for (const [key, value] of Object.entries(data)) {
			if (typeof value !== 'object' && value !== undefined && value !== null) {
				txData[key as keyof Transaction] = value.toString();
			}
		}
	} catch (error: any) {
		if (error instanceof TransactionNotFoundError) {
			// let senderTx: Transaction = {} as Transaction;
			// let receiverTxs: Transaction[] = [] as Transaction[];
			// Transaction is on Cosmos and is a CCTX
			data = await fetchCCTXData(txHash);
			// console.log(data);

			// // senderChainId
			// switch (data.inbound_tx_params.sender_chain_id) {
			// 	case '1':
			// 		senderTx = await ethClient.getTransaction({
			// 			hash: data.inbound_tx_params.inbound_tx_observed_hash as `0x${string}`,
			// 		})
			// 		break;
			// 	case '56':
			// 		senderTx = await bscClient.getTransaction({
			// 			hash: data.inbound_tx_params.inbound_tx_observed_hash as `0x${string}`,
			// 		})
			// 		break;
			// 	case '7000':
			// 		senderTx = await zetaClient.getTransaction({
			// 			hash: data.inbound_tx_params.inbound_tx_observed_hash as `0x${string}`,
			// 		})
			// 		break;
			// }

			// // receiverChainId
			// receiverTxs = await Promise.all(data.outbound_tx_params.map(async (tx: {
			// 	receiver_chainId: string;
			// 	outbound_tx_hash: string;
			// }) => {
			// 	switch (tx.receiver_chainId) {
			// 		case '1':
			// 			return await ethClient.getTransaction({
			// 				hash: tx.outbound_tx_hash as `0x${string}`,
			// 			})
			// 			break;
			// 		case '56':
			// 			return await bscClient.getTransaction({
			// 				hash: tx.outbound_tx_hash as `0x${string}`,
			// 			})
			// 			break;
			// 		case '7000':
			// 			return await zetaClient.getTransaction({
			// 				hash: tx.outbound_tx_hash as `0x${string}`,
			// 			})
			// 			break;
			// 	}
			// }))

			// data.inbound_tx_params = senderTx;
			// data.outbound_tx_params = receiverTxs;

			const traverse = (obj: any) => {
				for (let key in obj) {
					if (typeof obj[key] === "object" && obj[key] !== null) {
						traverse(obj[key]);
					} else if (typeof obj[key] === "bigint") {
						obj[key] = obj[key].toString();
					}
				}
			}
			traverse(data);
			txData = data;
		} else {
			console.log(error);

			txData = "The transaction does not exist"
		}
	}
	return txData;
}

function getPrompt(txData: string) {
	return `You are a blockchain analyst from the layer-2 Scroll that has the task to simplify blockchain transactions. 
		You will be given information about a transaction, read the transaction and output only the most important information so a non developer can understand without having to look at complex technical aspects of how a blockchain transaction works
		Remember, the Chain ID 534352 indeed belongs to Scroll.
	For example important information is.
	
	what type of transaction was it,
	who was it from
	who was it to
	was it succesful?
	what was the amount
	automatically convert bigint values to decimal values, don't explain that you did it.`
}