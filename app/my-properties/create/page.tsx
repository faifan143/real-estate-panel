"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { api } from "@/lib/axios";
import { predictPrice } from "@/lib/price-prediction";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { PropertyImageUpload } from "@/components/property/property-image-upload";
import { Loader2 } from "lucide-react";

// Dynamically import MapPicker to avoid SSR issues
const DynamicMapPicker = dynamic(
  () =>
    import("@/components/ui/map-picker").then((mod) => ({
      default: mod.MapPicker,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-zinc-100 rounded-lg flex items-center justify-center">
        <p className="text-zinc-600">Loading map...</p>
      </div>
    ),
  },
);

const propertySchema = yup.object({
  title: yup.string().required("Title is required"),
  type: yup.string().required("Type is required"),
  address: yup.string().optional(),
  description: yup.string().optional(),
  price: yup
    .number()
    .min(100, "Price must be at least 100")
    .optional()
    .nullable(),
  latitude: yup.number().optional().nullable(),
  longitude: yup.number().optional().nullable(),
  area: yup
    .number()
    .min(0, "Area must be positive")
    .integer("Area must be an integer")
    .optional()
    .nullable(),
  rooms: yup
    .number()
    .min(0, "Rooms must be positive")
    .integer("Rooms must be an integer")
    .optional()
    .nullable(),
  floor: yup.number().integer("Floor must be an integer").optional().nullable(),
});

type PropertyFormData = yup.InferType<typeof propertySchema>;

export default function CreatePropertyPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mapKey, setMapKey] = useState(0);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormData>({
    resolver: yupResolver(propertySchema) as any,
  });

  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationMonthlyRent, setEstimationMonthlyRent] = useState<
    number | null
  >(null);
  const [estimationBuyPrice, setEstimationBuyPrice] = useState<number | null>(
    null,
  );

  const watchedType = watch("type");
  const watchedAddress = watch("address");
  const watchedArea = watch("area");
  const watchedRooms = watch("rooms");
  const canEstimate =
    (watchedType === "HOUSE" || watchedType === "APARTMENT") &&
    typeof watchedAddress === "string" &&
    watchedAddress.trim().length > 0 &&
    typeof watchedArea === "number" &&
    !Number.isNaN(watchedArea) &&
    watchedArea > 0 &&
    typeof watchedRooms === "number" &&
    !Number.isNaN(watchedRooms) &&
    watchedRooms >= 0;

  const handleEstimatePrice = async () => {
    if (!canEstimate) return;
    const type = watch("type");
    const location = (watch("address") || "").trim();
    const area = watch("area");
    const rooms = watch("rooms");
    const floor = watch("floor");
    const description = watch("description");
    if (
      (type !== "HOUSE" && type !== "APARTMENT") ||
      !location ||
      typeof area !== "number" ||
      Number.isNaN(area) ||
      typeof rooms !== "number" ||
      Number.isNaN(rooms)
    ) {
      toast.error(t("property.fillLocationAreaRooms"));
      return;
    }
    setIsEstimating(true);
    setEstimationMonthlyRent(null);
    try {
      const result = await predictPrice({
        type,
        location,
        area,
        rooms,
        ...(typeof floor === "number" && !Number.isNaN(floor) ? { floor } : {}),
        ...(description ? { description } : {}),
      });
      setValue("price", result.estimatedPrice, { shouldValidate: true });
      setEstimationBuyPrice(result.estimatedPrice);
      setEstimationMonthlyRent(result.estimatedMonthlyRent ?? null);
      toast.success(t("property.estimatedPriceNote"));
    } catch (err: any) {
      const msg =
        err.response?.data?.message || t("property.aiEstimationUnavailable");
      toast.error(msg);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setValue("latitude", lat);
    setValue("longitude", lng);
  };

  const onSubmit = async (data: PropertyFormData) => {
    try {
      setIsUploading(true);
      const formData = new FormData();

      // Add Property Details
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Add Multiple Images
      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await api.post("/properties", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const propertyId = response.data.propertyId;
      toast.success(t("property.propertyCreated"));
      router.push(`/properties/${propertyId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message || t("property.creationFailed");
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ProtectedRoute requireRole="USER">
      <Navbar />
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-none shadow-none md:border md:shadow-sm">
            <CardHeader>
              <CardTitle>{t("property.createProperty")}</CardTitle>
              <CardDescription>{t("property.addNewProperty")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="mb-2 block">
                        {t("property.title")} *
                      </Label>
                      <Input
                        id="title"
                        {...register("title")}
                        className="h-11"
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="type" className="mb-2 block">
                        {t("property.type")} *
                      </Label>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue
                                placeholder={t("property.selectType")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="APARTMENT">
                                {t("property.types.apartment")}
                              </SelectItem>
                              <SelectItem value="HOUSE">
                                {t("property.types.house")}
                              </SelectItem>
                              <SelectItem value="COMMERCIAL">
                                {t("property.types.commercial")}
                              </SelectItem>
                              <SelectItem value="LAND">
                                {t("property.types.land")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.type && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.type.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="address" className="mb-2 block">
                        {t("property.address")}
                      </Label>
                      <Input
                        id="address"
                        {...register("address")}
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="price" className="mb-2 block">
                        {t("property.price")}
                      </Label>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Input
                          id="price"
                          type="number"
                          step="100"
                          min="100"
                          className="flex-1 min-w-[120px] h-11"
                          {...register("price", { valueAsNumber: true })}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-11 px-4"
                          disabled={!canEstimate || isEstimating}
                          onClick={handleEstimatePrice}
                        >
                          {isEstimating ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          {isEstimating
                            ? t("property.estimatingPrice")
                            : t("property.estimatePrice")}
                        </Button>
                      </div>
                      {watchedType &&
                        watchedType !== "HOUSE" &&
                        watchedType !== "APARTMENT" && (
                          <p className="text-xs text-amber-600 mt-1">
                            {t("property.estimationOnlyHouseApartment")}
                          </p>
                        )}
                      {estimationBuyPrice != null && (
                        <p className="text-xs text-primary/80 font-medium mt-1">
                          {t("property.estimatedBuyPrice")}: $
                          {estimationBuyPrice.toLocaleString()}
                        </p>
                      )}
                      {estimationMonthlyRent != null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("property.estimatedMonthlyRent")}: $
                          {estimationMonthlyRent.toLocaleString()} /{" "}
                          {t("property.perMonth")}
                        </p>
                      )}
                      {errors.price && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.price.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="area" className="mb-2 block">
                          {t("property.areaSqFt")}
                        </Label>
                        <Input
                          id="area"
                          type="number"
                          min="0"
                          className="h-11"
                          {...register("area", { valueAsNumber: true })}
                        />
                        {errors.area && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.area.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="rooms" className="mb-2 block">
                          {t("property.rooms")}
                        </Label>
                        <Input
                          id="rooms"
                          type="number"
                          min="0"
                          className="h-11"
                          {...register("rooms", { valueAsNumber: true })}
                        />
                        {errors.rooms && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.rooms.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="floor" className="mb-2 block">
                          {t("property.floor")}
                        </Label>
                        <Input
                          id="floor"
                          type="number"
                          className="h-11"
                          {...register("floor", { valueAsNumber: true })}
                        />
                        {errors.floor && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.floor.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="mb-2 block">
                        {t("property.description")}
                      </Label>
                      <Textarea
                        id="description"
                        {...register("description")}
                        rows={6}
                        className="resize-none"
                      />
                    </div>
                  </div>

                  {/* Right Column: Media and Location */}
                  <div className="space-y-6">
                    <div className="bg-muted/30 p-4 rounded-xl border-2 border-dashed border-border/50">
                      <PropertyImageUpload onChange={setSelectedFiles} />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-semibold mb-2 block">
                        {t("property.propertyLocationOnMap")}
                      </Label>
                      <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                        <DynamicMapPicker
                          key={`map-picker-create-${mapKey}`}
                          mapKey={`create-${mapKey}`}
                          latitude={latitude}
                          longitude={longitude}
                          onLocationChange={handleLocationChange}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 bg-zinc-50 p-2 rounded-lg border border-zinc-100 italic">
                        {t("property.clickMapToSetLocation")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border/50">
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1 h-14 text-lg font-semibold shadow-lg shadow-primary/20"
                    disabled={isSubmitting || isUploading}
                  >
                    {isSubmitting || isUploading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isUploading
                          ? t("property.uploading")
                          : t("property.creating")}
                      </div>
                    ) : (
                      t("property.createProperty")
                    )}
                  </Button>
                  <Link href="/my-properties" className="flex-1">
                    <Button
                      variant="outline"
                      type="button"
                      size="lg"
                      className="w-full h-14 text-lg"
                    >
                      {t("common.cancel")}
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
