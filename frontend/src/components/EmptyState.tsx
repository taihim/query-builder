import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  onAddClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-6 p-8">
          <h2 className="text-2xl font-semibold">No Data Sources</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Connect to a database to get started building queries
          </p>
          <div className="relative mt-8 inline-block">
            <Button 
              onClick={onAddClick}
              size="lg"
              className="relative z-10"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Your First Data Source
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 