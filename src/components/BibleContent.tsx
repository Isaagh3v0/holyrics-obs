import { motion } from "framer-motion";

interface BibleContentProps {
  header: string | null;
  content: string[];
  fontSize: number;
}

export default function BibleContent({ header, content, fontSize }: BibleContentProps) {
  if (!content || content.length === 0) return null;

  const primaryText = content[0] || "";
  const secondaryText = content[1] || "";
  const verseNumber = header ? parseInt(header.split(":")[1]?.trim() || "0") : 0;

  // Combine primary and secondary text, split into two lines
  const fullText = `${primaryText}${secondaryText ? " " + secondaryText : ""}`;
  const words = fullText.split(" ");
  const half = Math.ceil(words.length / 2);
  const firstLine = words.slice(0, half).join(" ");
  const secondLine = words.slice(half).join(" ");

  return (
    <div className="flex flex-col items-center justify-center w-full text-white" style={{ fontSize: `${fontSize}px` }}>
      {header && (
        <motion.span
          className="block text-[70%] mb-4 font-bold tracking-wide"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {header}
        </motion.span>
      )}
      <motion.div
        className="flex flex-col items-center space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.1 }}
      >
        <span className="inline-flex items-baseline">
          <span className="text-[50%]">
            <sup>{verseNumber}</sup>
          </span>
          <span className="text-[50%] mx-1"> </span>
          {firstLine}
        </span>
        {secondLine && (
          <motion.span
            className="inline-flex items-baseline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <span className="text-[50%]">
              <sup>{verseNumber}</sup>
            </span>
            <span className="text-[50%] mx-1"> </span>
            {secondLine}
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}