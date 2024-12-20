// src/components/Houses.jsx

import React, { useState, useEffect } from "react";
import { Dialog, RadioGroup } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import HouseCard from "./HouseCard";
import useFetchHouses from "./useFetchHouses";
import useFetchHouseTypes from "./useFetchHouseTypes";
import Loading from "../../ui/Loading";
import { createHouse, deleteHouse } from "../../services/houseService";
import CustomInfoIcon from "./../../ui/CustomInfoIcon";

const Houses = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: houses = [],
    isLoading: isHousesLoading,
    isError: isHousesError,
    refetch: refetchHouses,
    isFetching: isRefetchingHouses,
  } = useFetchHouses();

  const {
    data: houseTypes = [],
    isLoading: isHouseTypesLoading,
    isFetching: isHouseTypesFetching,
    isError: isHouseTypesError,
  } = useFetchHouseTypes();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] =
    useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [dialogErrorMessage, setDialogErrorMessage] = useState("");
  const [houseToDelete, setHouseToDelete] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false); // State for info modal

  useEffect(() => {
    if (isAddDialogOpen && houseTypes.length > 0) {
      setSelectedOption(houseTypes[0].key);
    }
  }, [isAddDialogOpen, houseTypes]);

  const createHouseMutation = useMutation(createHouse, {
    onSuccess: async (response) => {
      const uuid = response.uuid;
      toast.success("اقامتگاه با موفقیت اضافه شد!");
      navigate(`/dashboard/edit-house/${uuid}`);
      await queryClient.invalidateQueries(["get-houses"]);
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        "خطا در اضافه کردن اقامتگاه. لطفاً دوباره تلاش کنید.";
      setDialogErrorMessage(errorMessage);
      toast.error(errorMessage);
    },
  });

  const deleteHouseMutation = useMutation(deleteHouse, {
    onSuccess: async () => {
      toast.success("اقامتگاه با موفقیت حذف شد!");
      setIsDeleteConfirmDialogOpen(false);
      await refetchHouses();
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        "خطا در حذف اقامتگاه. لطفاً دوباره تلاش کنید.";
      toast.error(errorMessage);
    },
  });

  const handleAddHouse = async () => {
    setDialogErrorMessage("");
    await createHouseMutation.mutateAsync({ structure: selectedOption });
    setIsAddDialogOpen(false);
  };

  const handleDeleteHouse = async (houseId) => {
    setHouseToDelete(houseId);
    setIsDeleteConfirmDialogOpen(true);
  };

  const confirmDeleteHouse = async () => {
    if (houseToDelete) {
      await deleteHouseMutation.mutateAsync(houseToDelete);
      setHouseToDelete(null);
    }
  };
  console.log(houses);
  if (isRefetchingHouses) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <Loading message="در حال بارگذاری اقامتگاه‌ها..." />
      </div>
    );
  }

  if (isHousesError || isHouseTypesError) {
    return (
      <div className="text-center text-red-500">
        خطا در بارگذاری اقامتگاه‌ها یا نوع اقامتگاه. لطفا دوباره امتحان کنید.
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4">
      <div className="w-full flex justify-between items-center mb-2 lg:mb-4">
        <h2 className="text-xl">اقامتگاه ها :</h2>

        <div className="flex items-center">
          <CustomInfoIcon
            className="w-6 h-6 text-gray-500 cursor-pointer ml-2"
            onClick={() => setIsInfoModalOpen(true)}
          />
          <button
            className="btn bg-primary-600 hover:opacity-100"
            onClick={() => setIsAddDialogOpen(true)}
          >
            اضافه کردن اقامتگاه
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {houses.map((house) => (
          <HouseCard
            key={house.uuid}
            house={house}
            onDelete={() => handleDeleteHouse(house.uuid)}
            isDeleting={
              houseToDelete === house.uuid && deleteHouseMutation.isLoading
            }
          />
        ))}
      </div>

      {/* Add House Modal */}
      <Dialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="max-w-lg space-y-4 border bg-white p-12 rounded-3xl w-full">
            <Dialog.Title className="font-bold text-xl">
              افزودن اقامتگاه
            </Dialog.Title>
            <p>لطفاً نوع اقامتگاه خود را وارد کنید :</p>
            {isHouseTypesFetching ? (
              <Loading message="در حال بارگذاری نوع اقامتگاه..." />
            ) : (
              <div className="w-full">
                <RadioGroup
                  value={selectedOption}
                  onChange={setSelectedOption}
                  className="grid grid-cols-2 gap-2"
                >
                  {houseTypes.map((option) => (
                    <RadioGroup.Option
                      key={option.key}
                      value={option.key}
                      className="flex items-center"
                    >
                      {({ checked }) => (
                        <div
                          className={`flex items-center px-3 md:px-4 py-2 border overflow-hidden rounded-2xl cursor-pointer w-full ${
                            checked ? "bg-primary-600" : ""
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <img
                              src={option.icon}
                              alt={option.label}
                              className="w-4 md:w-6  h-4 md:h-6 "
                            />
                          </div>
                          <div className="ml-3 flex flex-col">
                            <label
                              className={`lg:text-lg truncate text-sm font-medium mr-2 ${checked ? "text-secondary-200" : ""}`}
                            >
                              {option.label}
                            </label>
                          </div>
                        </div>
                      )}
                    </RadioGroup.Option>
                  ))}
                </RadioGroup>
              </div>
            )}
            {dialogErrorMessage && (
              <p className="text-red-500 mt-2">{dialogErrorMessage}</p>
            )}
            <div className="flex gap-4 mt-4">
              <button
                className="btn bg-gray-300 text-gray-800"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={createHouseMutation.isLoading}
              >
                لغو
              </button>
              <button
                className="btn bg-primary-600 hover:opacity-100"
                onClick={handleAddHouse}
                disabled={createHouseMutation.isLoading}
              >
                {createHouseMutation.isLoading
                  ? "در حال اضافه کردن ..."
                  : "اضافه کردن"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteConfirmDialogOpen}
        onClose={() => setIsDeleteConfirmDialogOpen(false)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="max-w-lg space-y-4 border bg-white p-6 rounded-3xl w-full">
            <Dialog.Title className="font-bold text-xl">
              آیا از حذف کردن این اقامتگاه مطمئن هستید؟
            </Dialog.Title>
            <div className="flex gap-4 mt-4">
              <button
                className="btn bg-gray-300 text-gray-800"
                onClick={() => setIsDeleteConfirmDialogOpen(false)}
                disabled={deleteHouseMutation.isLoading}
              >
                لغو
              </button>
              <button
                className="btn bg-red-600 text-white"
                onClick={confirmDeleteHouse}
                disabled={deleteHouseMutation.isLoading}
              >
                {deleteHouseMutation.isLoading ? "در حال حذف..." : "بله"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Info Modal */}
      <Dialog
        open={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="max-w-lg border bg-white p-6 rounded-3xl w-full">
            <Dialog.Title className="font-bold text-xl">
              میزبان گرامی
            </Dialog.Title>
            <p className="mt-4 text-justify leading-7">
              میزبان گرامی، به دلیل تنوع انواع اقامتگاه و اطلاعات متفاوت آن‌ها
              در سایت ممکن است ثبت اقامتگاه برای شما کمی زمان‌بر و پیچیده باشد.
              توجه داشته باشید که ثبت و تایید اقامتگاه در سایت برای هر اقامتگاه
              فقط یک‌بار می‌باشد و در آینده تنها احتیاج به به‌روز نگهداری تقویم
              قیمت اقامتگاه است. پس با حوصله و دقیق به این کار اقدام فرمایید و
              در صورت هرگونه ایراد یا اشکال با پشتیبانی سایت تماس بگیرید.
            </p>
            <div className="flex justify-end mt-6">
              <button
                className="btn bg-primary-600 text-white"
                onClick={() => setIsInfoModalOpen(false)}
              >
                بستن
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default Houses;
