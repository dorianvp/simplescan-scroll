// @ts-nocheck
'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Message } from "../features/chat/message"
import { createRef, HTMLAttributes, useEffect, useRef, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormControl, Form, FormField, FormItem } from "../ui/form"
import { CCTX, generateInitialResponse, generateResponse, getTxData } from "@/lib/actions/transaction"
import { cn } from "@/lib/utils"
import { Transaction } from "viem"

let introLoaded = false;

type Message = {
	text: string;
	thirdParty: boolean;
}

const FormSchema = z.object({
	message: z.string(),
})

export const TransactionSchema = z.object({
	txHash: z.string().length(64, {
		message: 'Must be 66 characters long',
	}).startsWith('0x', {
		message: 'Must start with 0x',
	}),
})

export function Chat({ txHash, className }: z.infer<typeof TransactionSchema> & HTMLAttributes<HTMLDivElement>) {
	const [chat, setChat] = useState<Message[]>([])
	const [data, setData] = useState<Transaction & { status: string } | string | { [key: string]: any; } | CCTX>();
	const inputRef = createRef<HTMLInputElement>();
	const containerRef = createRef<HTMLDivElement>();
	const lastMessage = createRef<HTMLDivElement>();

	useEffect(() => {
		if (!introLoaded) {
			introLoaded = true;
			getTxData(txHash).then((data) => {
				// console.log(data);

				setData(data);
				generateInitialResponse({ txData: JSON.stringify(data) }).then((response) => {
					// console.log(response);

					setChat((prev) => [
						...prev,
						{
							text: response[0].data as string,
							thirdParty: false,
							time: new Date().toLocaleTimeString()
						},
						{
							// @ts-ignore
							text: response[1].data.content[0].text as string,
							thirdParty: true,
							time: new Date().toLocaleTimeString()
						}
					]);
				})
			})
		}
	}, [])

	useEffect(() => {
		lastMessage.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
		form.resetField('message');
		inputRef.current?.focus();
	}, [chat]);

	const { formState, ...form } = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			message: '',
		}
	})

	function submit(data: z.infer<typeof FormSchema>) {
		if (data.message) {
			setChat((prev) => [
				...prev,
				{
					text: data.message as string,
					thirdParty: false,
				}
			]);
			const previousMessages = chat.map<{ role: "user" | "assistant", content: string }>(message => {
				return {
					role: message.thirdParty ? 'assistant' : 'user',
					content: message.text
				}
			})
			// console.log(previousMessages);

			generateResponse(previousMessages, data.message).then((response) => {
				setChat((prev) => [
					...prev,
					{
						text: response.data.content[0].type === 'text' ? response.data.content[0].text as string : '',
						thirdParty: true,
					}
				]);
			})
		}
	}
	return (
		<section className="flex w-full h-5/6 items-center justify-center px-5">
			<section className="md:w-1/2 xl:w-1/3 h-full hidden md:flex flex-col items-start justify-start p-10 overflow-hidden">
				<h2 className="my-2">

					Transaction Status:
					<span className="font-bold">
						{data?.status ? data.status : data?.cctx_status ? data.cctx_status.status : 'N/A'}
					</span>
				</h2>
				<h2 className="my-2">Amount: <span className="font-bold">{data?.value ? data.value / 1000000000000000000 : data?.inbound_tx_params ? data.inbound_tx_params.amount / 1000000000000000000 : 'N/A'}</span></h2>
				<h2 className="my-2">Blocknumber: <span className="font-bold">{data?.blockNumber ? data.blockNumber : 'N/A'}</span></h2>
				<h2 className="my-2">
					From: <span className="font-bold">{data?.from ? data.from : data?.inbound_tx_params ? data.inbound_tx_params?.sender : 'N/A'}</span>
				</h2>
				<h2 className="my-2">
					To: <span className="font-bold">{data?.to ? data.to : data?.outbound_tx_params ? data.outbound_tx_params[0].receiver : 'N/A'}</span>
				</h2>
			</section>
			<section className={cn("flex flex-col h-full border border-neutral-300 shadow-sm rounded-lg w-full lg:w-1/2 xl:w-2/3", className)}>
				<header className="bg-primary p-4 rounded-t-lg">
					<h2 className="text-2xl font-bold text-primary-foreground text-nowrap overflow-hidden text-ellipsis">Chat with the transaction</h2>
				</header>
				<div
					ref={containerRef}
					className="flex-1 overflow-auto p-5 space-y-4 w-full mx-auto">
					{chat.map((message, index) => {
						if (index > 0) {
							return (
								<div key={index} className={`flex w-full ${message.thirdParty ? "justify-start" : "justify-end"}`} >
									<Message text={message.text} thirdParty={message.thirdParty} />
								</div>
							)
						}
					})}
					<div ref={lastMessage} className="mt-0 flex" />
				</div>
				<Form formState={formState} {...form}>
					<form
						className="bg-background border-t px-4 py-3 flex items-center justify-center gap-2"
						onSubmit={form.handleSubmit(submit)}
					>
						<FormField
							control={form.control}
							name="message"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormControl>
										<Input placeholder="Type your message..." className="flex-1" {...field} ref={inputRef} />
									</FormControl>
								</FormItem>
							)}
						/>
						<Button type="submit" size="icon">
							<SendIcon className="w-5 h-5" />
						</Button>
					</form>
				</Form>
			</section >
		</section >
	)
}


function SendIcon(props: any) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="m22 2-7 20-4-9-9-4Z" />
			<path d="M22 2 11 13" />
		</svg>
	)
}