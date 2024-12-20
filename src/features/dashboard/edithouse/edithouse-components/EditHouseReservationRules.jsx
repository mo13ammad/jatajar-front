// src/components/edithouse-components/EditHouseReservationRules.jsx

import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import Spinner from "../../../../ui/Loading";
import NumberField from "../../../../ui/NumberField";
import { toast, Toaster } from "react-hot-toast";
import { useFetchWeekendOptions } from "../../../../services/fetchDataService";
import WeekendTypeSelect from "./WeekendTypeSelect"; // Import the new component

const EditHouseReservationRules = forwardRef((props, ref) => {
  const { houseData, handleEditHouse, loadingHouse, refetchHouseData } = props;

  const [isModified, setIsModified] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorList, setErrorList] = useState([]);
  const { data: weekendOptions = [], isLoading: loadingWeekendOptions } =
    useFetchWeekendOptions();

  const [formData, setFormData] = useState({
    short_term_booking_length:
      houseData?.reservation?.discount?.short_term?.minimum_length_stay ?? "",
    short_term_booking_discount:
      houseData?.reservation?.discount?.short_term?.discount ?? "",
    long_term_booking_length:
      houseData?.reservation?.discount?.long_term?.minimum_length_stay ?? "",
    long_term_booking_discount:
      houseData?.reservation?.discount?.long_term?.discount ?? "",
    minimum_length_stay: houseData?.reservation?.minimum_length_stay ?? {
      all: "1",
      Saturday: "1",
      Sunday: "1",
      Monday: "1",
      Tuesday: "1",
      Wednesday: "1",
      Thursday: "1",
      Friday: "1",
    },
    enter_from: houseData?.reservation?.timing?.enter?.from ?? "14:00",
    enter_until: houseData?.reservation?.timing?.enter?.to ?? "23:00",
    discharge_time: houseData?.reservation?.timing?.leave ?? "12:00",
    capacity: houseData?.reservation?.capacity?.normal ?? "",
    maximum_capacity: houseData?.reservation?.capacity?.maximum ?? "",
    weekendType: houseData?.weekendType?.key ?? "",
  });

  useEffect(() => {
    if (houseData?.reservation?.minimum_length_stay) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        minimum_length_stay: {
          all: "1",
          Saturday: "1",
          Sunday: "1",
          Monday: "1",
          Tuesday: "1",
          Wednesday: "1",
          Thursday: "1",
          Friday: "1",
          ...houseData.reservation.minimum_length_stay,
        },
      }));
    }
  }, [houseData]);

  // اضافه کردن useEffect برای تنظیم مقدار پیش‌فرض enter_from

  const handleInputChange = (name, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: null,
    }));
    setIsModified(true);
  };

  const handleMinimumStayChange = (day, value) => {
    setFormData((prevData) => ({
      ...prevData,
      minimum_length_stay: {
        ...prevData.minimum_length_stay,
        [day]: value,
      },
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      minimum_length_stay: null,
    }));
    setIsModified(true);
  };

  const validateForm = () => {
    const errors = {};

    // Validate required fields
    if (!formData.enter_from) {
      errors.enter_from = ["زمان ورود از را وارد کنید"];
    }
    if (!formData.enter_until) {
      errors.enter_until = ["زمان ورود تا را وارد کنید"];
    }
    if (!formData.discharge_time) {
      errors.discharge_time = ["زمان تخلیه را وارد کنید"];
    }
    if (!formData.capacity) {
      errors.capacity = ["ظرفیت استاندارد را وارد کنید"];
    }
    if (!formData.maximum_capacity) {
      errors.maximum_capacity = ["حداکثر ظرفیت را وارد کنید"];
    }
    if (!formData.weekendType) {
      errors.weekendType = ["روزهای آخر هفته را انتخاب کنید"];
    }

    setErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const validateAndSubmit = async () => {
    if (!isModified) {
      console.log("No changes detected, submission skipped.");
      return true;
    }

    setLoadingSubmit(true);
    setErrors({});
    setErrorList([]);

    if (!validateForm()) {
      toast.error("لطفاً خطاهای فرم را بررسی کنید");
      setLoadingSubmit(false);
      return false;
    }

    try {
      await handleEditHouse(formData);
      setIsRefetching(true);
      await refetchHouseData();
      toast.success("اطلاعات با موفقیت ثبت شد");
      setIsModified(false);
      return true;
    } catch (errorData) {
      console.error("Edit House Error:", errorData);

      if (errorData.errors || errorData.message) {
        if (errorData.errors?.fields) {
          const fieldErrors = errorData.errors.fields;
          const updatedErrors = {};
          const errorsArray = [];

          for (let field in fieldErrors) {
            updatedErrors[field] = fieldErrors[field];
            errorsArray.push(...fieldErrors[field]);
          }
          setErrors(updatedErrors);
          setErrorList(errorsArray);
        }

        if (errorData.message) {
          toast.error(errorData.message);
        }
      } else {
        toast.error("متاسفانه مشکلی پیش آمده لطفا دوباره امتحان کنید");
      }
      return false;
    } finally {
      setLoadingSubmit(false);
      setIsRefetching(false);
    }
  };

  useImperativeHandle(ref, () => ({
    validateAndSubmit,
  }));

  if (loadingHouse || loadingWeekendOptions || isRefetching) {
    console.log("Loading data...");
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner message="در حال بارگذاری..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      {errorList.length > 0 && (
        <div className="error-list mb-4">
          {errorList.map((error, index) => (
            <div key={index} className="text-red-500 text-sm">
              {error}
            </div>
          ))}
        </div>
      )}
      <h1 className="text-xl font-bold mb-4">قوانین رزرو</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NumberField
          label="تعداد شب اقامت کوتاه‌مدت"
          name="short_term_booking_length"
          value={formData.short_term_booking_length ?? ""}
          onChange={(e) =>
            handleInputChange("short_term_booking_length", e.target.value)
          }
          placeholder="تعداد شب رزرو کوتاه‌مدت"
          errorMessages={errors.short_term_booking_length}
          min="0"
        />

        <NumberField
          label="درصد تخفیف کوتاه‌مدت"
          name="short_term_booking_discount"
          value={formData.short_term_booking_discount ?? ""}
          onChange={(e) =>
            handleInputChange("short_term_booking_discount", e.target.value)
          }
          placeholder="درصد تخفیف"
          errorMessages={errors.short_term_booking_discount}
          min="0"
          max="100"
        />

        <NumberField
          label="تعداد شب اقامت بلندمدت"
          name="long_term_booking_length"
          value={formData.long_term_booking_length ?? ""}
          onChange={(e) =>
            handleInputChange("long_term_booking_length", e.target.value)
          }
          placeholder="تعداد شب رزرو بلندمدت"
          errorMessages={errors.long_term_booking_length}
          min="0"
        />

        <NumberField
          label="درصد تخفیف بلندمدت"
          name="long_term_booking_discount"
          value={formData.long_term_booking_discount ?? ""}
          onChange={(e) =>
            handleInputChange("long_term_booking_discount", e.target.value)
          }
          placeholder="درصد تخفیف"
          errorMessages={errors.long_term_booking_discount}
          min="0"
          max="100"
        />

        <div>
          <label className="block text-sm xl:text-lg font-medium mb-2">
            زمان ورود از
          </label>
          <input
            type="time"
            value={formData.enter_from ?? ""}
            onChange={(e) => handleInputChange("enter_from", e.target.value)}
            className={`px-3 py-1.5 border rounded-2xl bg-white shadow-centered w-full outline-none ${
              errors.enter_from ? "border-red-500" : ""
            }`}
          />
          {errors.enter_from && (
            <p className="text-red-500 text-sm mt-1">{errors.enter_from[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm xl:text-lg font-medium mb-2">
            زمان ورود تا
          </label>
          <input
            type="time"
            value={formData.enter_until ?? ""}
            onChange={(e) => handleInputChange("enter_until", e.target.value)}
            className={`px-3 py-1.5 border rounded-2xl bg-white shadow-centered w-full outline-none ${
              errors.enter_until ? "border-red-500" : ""
            }`}
          />
          {errors.enter_until && (
            <p className="text-red-500 text-sm mt-1">{errors.enter_until[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm xl:text-lg font-medium mb-2">
            زمان تخلیه
          </label>
          <input
            type="time"
            value={formData.discharge_time ?? ""}
            onChange={(e) =>
              handleInputChange("discharge_time", e.target.value)
            }
            className={`px-3 py-1.5 border rounded-2xl bg-white shadow-centered w-full outline-none ${
              errors.discharge_time ? "border-red-500" : ""
            }`}
          />
          {errors.discharge_time && (
            <p className="text-red-500 text-sm mt-1">
              {errors.discharge_time[0]}
            </p>
          )}
        </div>

        <NumberField
          label="ظرفیت استاندارد"
          name="capacity"
          type="number"
          value={formData.capacity ?? ""}
          onChange={(e) => handleInputChange("capacity", e.target.value)}
          errorMessages={errors.capacity}
          min="1"
        />
        <NumberField
          label="حداکثر ظرفیت"
          name="maximum_capacity"
          type="number"
          value={formData.maximum_capacity ?? ""}
          onChange={(e) =>
            handleInputChange("maximum_capacity", e.target.value)
          }
          errorMessages={errors.maximum_capacity}
          min="1"
        />
        <NumberField
          label="حداقل شب اقامت"
          name="minimum_length_stay.all"
          type="number"
          value={formData.minimum_length_stay.all ?? ""}
          onChange={(e) => handleMinimumStayChange("all", e.target.value)}
          errorMessages={errors["minimum_length_stay.all"]}
          min="0"
        />

        {/* Use WeekendTypeSelect instead of FormSelect */}
        <WeekendTypeSelect
          label="تعیین روزهای آخر هفته"
          name="weekendType"
          value={formData.weekendType ?? ""}
          onChange={handleInputChange}
          options={weekendOptions}
          errorMessages={errors.weekendType}
        />
      </div>

      <div className="mt-8 lg:col-span-2 lg:w-1/2">
        <label className="block text-sm xl:text-lg font-medium text-gray-700 mb-2">
          حداقل شب اقامت به ازای روزهای هفته
        </label>
        <table className="table-auto w-full rounded-xl text-right">
          <thead>
            <tr>
              <th className="p-2">روز</th>
              <th className="p-2">حداقل شب رزرو</th>
            </tr>
          </thead>
          <tbody>
            {[
              { key: "Saturday", label: "شنبه" },
              { key: "Sunday", label: "یکشنبه" },
              { key: "Monday", label: "دوشنبه" },
              { key: "Tuesday", label: "سه‌شنبه" },
              { key: "Wednesday", label: "چهارشنبه" },
              { key: "Thursday", label: "پنج‌شنبه" },
              { key: "Friday", label: "جمعه" },
            ].map((day) => (
              <tr key={day.key}>
                <td className="p-1">{day.label}</td>
                <td className="p-1">
                  <NumberField
                    name={`minimum_length_stay.${day.key}`}
                    value={formData.minimum_length_stay[day.key] ?? ""}
                    onChange={(e) =>
                      handleMinimumStayChange(day.key, e.target.value)
                    }
                    placeholder={`تعداد شب برای ${day.label}`}
                    type="number"
                    className="p-1 border rounded-xl max-w-[4rem] outline-none"
                    min="0"
                    errorMessages={errors[`minimum_length_stay.${day.key}`]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default EditHouseReservationRules;
