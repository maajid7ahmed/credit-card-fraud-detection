"use client";

import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, Variants } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";

// -------------------------
// Zod Schema
// -------------------------
const formSchema = z.object({
  amount: z.preprocess(
    (v) => (v === "" ? NaN : Number(v)),
    z.number().positive({ message: "Amount must be greater than 0" })
  ),
  category: z.string().min(1, { message: "Choose a category" }),
  merchant: z.string().min(2, { message: "Merchant name is required" }),
  timestamp: z.string().optional().refine((s) => !s || !Number.isNaN(Date.parse(s)), { message: "Invalid date/time" }),
  location: z.string().min(2, { message: "Location is required" }),
  device: z.string().min(1, { message: "Select device" }),
  card_present: z.enum(["1", "0"]),
  cvv_present: z.enum(["1", "0"]),
  card_bin: z
    .string()
    .min(4, { message: "BIN too short" })
    .max(12, { message: "BIN too long" })
    .regex(/^\d+$/, { message: "BIN must be numeric" }),
  ip_address: z.string().min(7, { message: "IP address is required" }).optional(),
  chargeback_history: z.preprocess(
    (v) => (v === "" ? NaN : Number(v)),
    z.number().min(0, { message: "Must be >= 0" })
  ),
});

// Let TypeScript infer the type
type FormData = z.infer<typeof formSchema>;

// -------------------------
// Component
// -------------------------
export default function FraudDetectionForm() {
  const [result, setResult] = useState<{
    predicted_is_fraud: number;
    fraud_probability: number;
    model: string;
    error?: string;
  } | null>(null);

// Get default timestamp (current ISO string for datetime-local)
const now = new Date();
const defaultTimestamp = now.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"

const [loading, setLoading] = useState(false);
const [selectedModel, setSelectedModel] = useState<"rf" | "lr">("rf");
const [defaultLocation, setDefaultLocation] = useState(""); 
const [ip, setIp] = useState("");

const {
  register,
  control,
  handleSubmit,
  formState: { errors },
  reset,
} = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: {
    amount: 0,
    category: "",
    merchant: "",
    timestamp: defaultTimestamp,
    location: "", // start empty
    device: "",
    card_present: "1",
    cvv_present: "1",
    card_bin: "",
    ip_address: "",
    chargeback_history: 0,
  },
});

useEffect(() => {
  const fetchLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();

      const fetchedLocation = data.country_name || "";
      const fetchedIp = data.ip || "";

      setDefaultLocation(fetchedLocation);
      setIp(fetchedIp);

      // Update the form values dynamically using fetched data
      reset({
        amount: 0,
        category: "",
        merchant: "",
        timestamp: defaultTimestamp,
        location: fetchedLocation,
        device: "",
        card_present: "1",
        cvv_present: "1",
        card_bin: "",
        ip_address: fetchedIp,
        chargeback_history: 0,
      });

      console.log("Detected location:", fetchedLocation);
      console.log("Detected IP:", fetchedIp);
    } catch (err) {
      console.error("Failed to fetch location:", err);
    }
  };

  fetchLocation();
}, [reset, defaultTimestamp]);



  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setResult(null);

    const payload = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
      amount: Number(data.amount),
      chargeback_history: Number(data.chargeback_history),
      card_present: Number(data.card_present),
      cvv_present: Number(data.cvv_present),
      card_bin: Number(data.card_bin),
      ip_address: data.ip_address || "",
    };

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel, ...payload }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Prediction API error");
      }

      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setResult({
        predicted_is_fraud: 1,
        fraud_probability: 0,
        model: "error",
        error: err.message || "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

const resultVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  enter: { opacity: 1, scale: 1, transition: { duration: 0.28, ease: "easeOut" } },
};



  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* LEFT: FORM */}
        <motion.div initial="hidden" animate="enter" variants={panelVariants}>
          <Card className="p-6 shadow-lg rounded-2xl border border-blue-100 bg-white">
            <CardHeader className="mb-2">
              <CardTitle className="text-2xl font-semibold text-blue-800">💳 Credit Card Fraud Detection</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Fill in transaction details, select model, and predict fraud.</p>

              <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>

                {/* Amount */}
                <div>
                  <label className="text-sm text-blue-800 font-medium">Amount ($)</label>
                  <Input
                    {...register("amount")}
                    type="number"
                    step="0.01"
                    placeholder="e.g. 49.99"
                    aria-invalid={!!errors.amount}
                    className={cn("mt-1", errors.amount && "border-red-400")}
                  />
                  {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm text-blue-800 font-medium">Category</label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="fashion">Fashion</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
                </div>

                {/* Merchant */}
                <div>
                  <label className="text-sm text-blue-800 font-medium">Merchant</label>
                  <Input {...register("merchant")} placeholder="Merchant name" className="mt-1" />
                  {errors.merchant && <p className="mt-1 text-xs text-red-600">{errors.merchant.message}</p>}
                </div>

                {/* Timestamp */}
                <div>
                  <label className="text-sm text-blue-800 font-medium">Timestamp</label>
                  <Input {...register("timestamp")} type="datetime-local" className="mt-1" />
                  {errors.timestamp && <p className="mt-1 text-xs text-red-600">{errors.timestamp.message}</p>}
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm text-blue-800 font-medium">Location</label>
                  <Input {...register("location")} placeholder="e.g. United States" className="mt-1" />
                  {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>}
                </div>

                {/* Device */}
                <div>
                  <label className="text-sm text-blue-800 font-medium">Device</label>
                  <Controller
                    control={control}
                    name="device"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mobile">Mobile</SelectItem>
                          <SelectItem value="tablet">Tablet</SelectItem>
                          <SelectItem value="desktop">Desktop</SelectItem>
                          <SelectItem value="pos">POS Terminal</SelectItem>
                          <SelectItem value="smartwatch">Smartwatch</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.device && <p className="mt-1 text-xs text-red-600">{errors.device.message}</p>}
                </div>

                {/* Card Present */}
                <div>
                  <label className="text-sm text-blue-800 font-medium">Card Present</label>
                  <Controller
                    control={control}
                    name="card_present"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Card present?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Yes</SelectItem>
                          <SelectItem value="0">No</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* CVV Present */}
                <div>
                  <label className="text-sm text-blue-800 font-medium">CVV Present</label>
                  <Controller
                    control={control}
                    name="cvv_present"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="CVV present?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Yes</SelectItem>
                          <SelectItem value="0">No</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Card BIN */}
                <div>
                  <label className="text-sm text-blue-800 font-medium">Card BIN</label>
                  <Input {...register("card_bin")} placeholder="e.g. 423456" className="mt-1" />
                  {errors.card_bin && <p className="mt-1 text-xs text-red-600">{errors.card_bin.message}</p>}
                </div>

                {/* IP Address */}
                <div>
                  <label className="text-sm text-blue-800 font-medium">IP Address</label>
                  <Input {...register("ip_address")} placeholder="192.168.1.2" className="mt-1" />
                  {errors.ip_address && <p className="mt-1 text-xs text-red-600">{errors.ip_address.message}</p>}
                </div>

                {/* Chargeback History */}
                <div>
                  <label className="text-sm text-blue-800 font-medium">Chargeback History</label>
                  <Input {...register("chargeback_history")} type="number" placeholder="e.g. 0" className="mt-1" />
                  {errors.chargeback_history && <p className="mt-1 text-xs text-red-600">{errors.chargeback_history.message}</p>}
                </div>

                {/* Model & Submit */}
                <div className="col-span-1 sm:col-span-2 flex items-center gap-3 mt-2">
                  <select
                    className="rounded-md border border-gray-300 p-2"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as "rf" | "lr")}
                  >
                    <option value="rf">Random Forest</option>
                    <option value="lr">Logistic Regression</option>
                  </select>

                  <Button type="submit" className="ml-2 bg-blue-500" disabled={loading}>
                    {loading ? "Analyzing..." : "Predict Fraud"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      reset();
                      setResult(null);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* RIGHT: RESULT */}
        <motion.div initial="hidden" animate="enter" variants={panelVariants}>
          <Card className="p-6 rounded-2xl border border-gray-200 shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-blue-800">Prediction Result</CardTitle>
            </CardHeader>

            <CardContent>
              {!result ? (
                <motion.div variants={resultVariants} initial="hidden" animate="enter" className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-gray-600">Results will appear here after you submit a transaction.</p>
                </motion.div>
              ) : (
                <motion.div variants={resultVariants} initial="hidden" animate="enter" className="p-6 rounded-xl">
                  {result.error ? (
                    <div className="bg-red-100 border border-red-300 text-red-800 rounded-xl p-4">
                      <h3 className="font-semibold">Error</h3>
                      <p className="mt-1 text-sm">{result.error}</p>
                    </div>
                  ) : result.predicted_is_fraud ? (
                    <div className="bg-red-100 border border-red-300 text-red-800 rounded-xl p-4">
                      <h3 className="text-lg font-bold">🚨 FRAUD DETECTED</h3>
                      <p className="mt-2">Probability: {(result.fraud_probability * 100).toFixed(2)}%</p>
                      <p className="mt-1 text-sm text-gray-600">Model: {result.model}</p>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4">
                      <h3 className="text-lg font-bold">✅ SAFE TRANSACTION</h3>
                      <p className="mt-2">Probability: {(result.fraud_probability * 100).toFixed(2)}%</p>
                      <p className="mt-1 text-sm text-gray-600">Model: {result.model}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
