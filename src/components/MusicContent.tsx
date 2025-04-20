import { motion } from "framer-motion";

interface MusicContentProps {
  header: string | null;
  content: string;
  fontSize: number;
}

export default function MusicContent({ header, content, fontSize }: MusicContentProps) {
  if (!content) return null;

  const lineArray = content.split("\n");

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
      <motion.div className="flex flex-col items-center space-y-2">
        {lineArray.map((line, index) => (
          <motion.span
            key={index}
            className="block text-center"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 + index * 0.05 }}
          >
            {line}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}