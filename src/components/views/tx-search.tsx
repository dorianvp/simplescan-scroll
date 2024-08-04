'use client'

import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { z } from 'zod';
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { analyzeTx } from "@/lib/actions/transaction";

export const FormSchema = z.object({
	txHash: z.string().length(66, {
		message: 'Must be 66 characters long',
	}).startsWith('0x', {
		message: 'Must start with 0x',
	}),
})

export function TxSearch() {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			txHash: '',
		}
	})

	function submit(data: z.infer<typeof FormSchema>) {
		analyzeTx(data);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(submit)} className="space-y-8 w-full">
				<FormField
					control={form.control}
					name="txHash"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input placeholder="Transaction Hash" {...field} />
							</FormControl>
							<FormDescription>
								Search on Scroll
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">Submit</Button>
			</form>
		</Form>
	)
}