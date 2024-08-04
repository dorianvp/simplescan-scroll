import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import React, { forwardRef, HTMLAttributes } from "react";
import ReactMarkdown from 'react-markdown'

const messageVariants = cva(
	"rounded-lg px-4 py-2",
	{
		variants: {
			thirdParty: {
				false: "bg-primary text-primary-foreground max-w-[80%]",
				true: "bg-muted text-muted-foreground w-full",
			},
		},
		defaultVariants: {
			thirdParty: false,
		},
	}
)

type MessageProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof messageVariants> & {
	asChild?: boolean;
	text: string;
}

const Message = forwardRef<HTMLDivElement, MessageProps>(
	({ className, thirdParty, text }, ref) => {
		return (
			<div className={cn(messageVariants({ thirdParty, className }))} ref={ref}>
				<ReactMarkdown className="text-ellipsis overflow-hidden">{text}</ReactMarkdown>
				<div className="text-xs text-muted-foreground/80 mt-1">{thirdParty == true ? "System" : "You"} • {new Date().toLocaleTimeString([], {
					hour: "numeric",
					minute: "numeric",
				})}</div>
			</div >
		)
	}
)
Message.displayName = "Message"
export { Message }