'use client';

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const PricingPage = () => {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      description: "Rate limited",
      features: [
        { name: "Generations per day", value: "20" },
        { name: "Access to basic models", value: true },
        { name: "Download Code", value: true },
        { name: "Advanced model", value: false },
      ],
    },
    {
      name: "Pro",
      price: "$.10",
      description: "Per generation",
      features: [
        { name: "Generations per day", value: "Unlimited" },
        { name: "Access to basic models", value: true },
        { name: "Download Code", value: true },
        { name: "Advanced model", value: false },
      ],
    },
    {
      name: "Advanced",
      price: "$.25",
      description: "Per generation",
      features: [
        { name: "Generations per day", value: "Unlimited" },
        { name: "Access to basic models", value: true },
        { name: "Download Code", value: true },
        { name: "Advanced model", value: true },
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h1 
        className="text-4xl font-bold text-center mb-8 text-text-dark"
        variants={itemVariants}
      >
        Pricing Plans
      </motion.h1>
      <motion.div 
        className="overflow-x-auto rounded-lg shadow-lg"
        variants={itemVariants}
      >
        <table className="w-full border-collapse bg-background">
          <thead>
            <tr>
              <th className="p-4 bg-primary bg-opacity-10 text-left text-text-dark border-b border-primary border-opacity-25">Feature</th>
              {tiers.map((tier, index) => (
                <motion.th 
                  key={tier.name} 
                  className={`p-4 bg-primary bg-opacity-10 border-b border-primary border-opacity-25 ${index === tiers.length - 1 ? 'rounded-tr-lg' : ''}`}
                  variants={itemVariants}
                >
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-text-dark">{tier.name}</h2>
                    <p className="text-2xl font-bold text-primary">{tier.price}</p>
                    <p className="text-sm text-text-light">{tier.description}</p>
                  </div>
                </motion.th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tiers[0].features.map((feature, featureIndex) => (
              <motion.tr 
                key={feature.name} 
                className={featureIndex % 2 === 0 ? 'bg-primary bg-opacity-5' : 'bg-background'}
                variants={itemVariants}
              >
                <td className="p-4 font-medium text-text-dark border-b border-primary border-opacity-25">{feature.name}</td>
                {tiers.map((tier, tierIndex) => (
                  <td 
                    key={`${tier.name}-${feature.name}`} 
                    className={`p-4 text-center border-b border-primary border-opacity-25 ${tierIndex === tiers.length - 1 && featureIndex === tiers[0].features.length - 1 ? 'rounded-br-lg' : ''}`}
                  >
                    {typeof tier.features[featureIndex].value === 'boolean' ? (
                      tier.features[featureIndex].value ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                          <CheckCircle className="mx-auto text-primary" size={24} />
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                          <XCircle className="mx-auto text-text-light" size={24} />
                        </motion.div>
                      )
                    ) : (
                      <span className="text-text-dark">{tier.features[featureIndex].value}</span>
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
};

export default PricingPage;