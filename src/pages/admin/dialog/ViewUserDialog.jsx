import { useEffect, useState } from "react";
import { API_BASE } from '../../../utils/api';
import axios from '../../../utils/axios.js';
import { getAvatarSrc } from '../../../utils/image';

export default function ViewUserDialog({ open, onClose, userData }) {
  const [formData, setFormData] = useState({
    user_id: "",
    user_code: "",
    username: "",
    Fullname: "",
    pic: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    email: "",
    phone: "",
    position_name: "",
    branch_name: "",
    street: "",
    province: "",
    district: "",
    parish: "",
    postal_no: "",
    password: ""
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [positions, setPositions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [amphures, setAmphures] = useState([]);
  const [tambons, setTambons] = useState([]);
  const [selected, setSelected] = useState({
    province_id: undefined,
    amphure_id: undefined,
    tambon_id: undefined
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        user_id: userData.user_id || '',
        user_code: userData.user_code || '',
        username: userData.username || '',
        Fullname: userData.Fullname || '',
        pic: getAvatarSrc(userData.avatar),
        email: userData.email || '',
        phone: userData.phone || '',
        position_name: userData.position_name || '',
        branch_name: userData.branch_name || '',
        street: userData.street || '',
        province: userData.province || '',
        district: userData.district || '',
        parish: userData.parish || '',
        postal_no: userData.postal_no || '',
        password: ''
      });
  setPreviewImage(getAvatarSrc(userData.avatar));
    }
  }, [userData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [positionsResponse, branchesResponse, rolesResponse, provincesResponse] = await Promise.all([
          axios.get(`${API_BASE}/users/positions`),
          axios.get(`${API_BASE}/users/branches`),
          axios.get(`${API_BASE}/users/roles`),
          fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json').then(res => res.json())
        ]);
        setPositions(positionsResponse.data);
        setBranches(branchesResponse.data);
        setRoles(rolesResponse.data);
        setProvinces(provincesResponse || []);

        if (userData) {
          const province = (provincesResponse || []).find(p => p.name_th === userData.province);
          if (province) {
            const districts = province.districts || [];
            setAmphures(districts);
            const district = districts.find(a => a.name_th === userData.district);
            if (district) {
              const subDistricts = district.sub_districts || [];
              setTambons(subDistricts);
              const sub = subDistricts.find(t => t.name_th === userData.parish);
              if (sub) {
                setSelected({
                  province_id: province.id,
                  amphure_id: district.id,
                  tambon_id: sub.id
                });
              }
            }
          }
        }
      } catch (error) {
        // Error handling
      }
    };
    if (open) fetchData();
  }, [open, userData]);

  if (!open) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm bg-black/30">
      <div className="relative w-full max-h-[90vh] max-w-8xl mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 animate-fadeIn transition-all duration-500 transform scale-100 hover:shadow-3xl overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-red-500 p-3 rounded-full hover:bg-red-50 z-20 transition-all duration-300 transform hover:rotate-180 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row h-full">
          <div className="flex flex-col items-center justify-start pt-20 px-12 bg-blue-50 md:min-w-[320px] relative overflow-hidden">
            <div className="mb-10 text-center relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4 shadow-full">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-blue-700 mb-2">ข้อมูลผู้ใช้งาน</h2>
              <h3 className="text-lg font-semibold text-blue-700 mb-1">รูปโปรไฟล์</h3>
              <p className="text-sm text-gray-600">รูปภาพโปรไฟล์ผู้ใช้งาน</p>
            </div>
            
            <div className="relative group">
              <div className="w-40 h-40 rounded-full bg-white shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-105">
                <img
                  src={previewImage || "/logo_it.png"}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full transition-all duration-500 group-hover:scale-110"
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = "/logo_it.png";
                  }}
                />
              </div>
              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                userData?.role_name === 'admin' ? 'bg-red-500' :
                userData?.role_name === 'executive' ? 'bg-purple-500' :
                'bg-emerald-500'
              }`}>
                {userData?.role_name === 'user' ? 'ผู้ใช้งาน' : userData?.role_name === 'admin' ? 'ผู้ดูแลระบบ' : userData?.role_name === 'executive' ? 'ผู้บริหาร' : userData?.role_name}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-start px-10 md:px-12 py-8 bg-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/30 rounded-full -translate-y-32 translate-x-32"></div>
            
            <div className="relative z-10">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-blue-700 mb-3">
                  ข้อมูลผู้ใช้งาน
                </h2>
                <div className="w-20 h-1 bg-blue-500 rounded-full"></div>
              </div>
              
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100/50 hover:border-blue-200/50 group">
                    <div className="flex items-center space-x-3 pb-4 mb-6">
                      <div className="p-2 bg-blue-500 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700">ข้อมูลผู้ใช้งาน</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          รหัสนิสิต
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="user_code"
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 shadow-inner focus:shadow-md transition-all duration-300"
                            value={formData.user_code}
                            readOnly
                            disabled
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          ชื่อ-นามสกุล
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="Fullname"
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 shadow-inner focus:shadow-md transition-all duration-300"
                            value={formData.Fullname}
                            readOnly
                            disabled
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            ตำแหน่ง
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="position_name"
                              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300"
                              value={formData.position_name}
                              readOnly
                              disabled
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            สาขา
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="branch_name"
                              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300"
                              value={formData.branch_name}
                              readOnly
                              disabled
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          ชื่อผู้ใช้งาน
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="username"
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 shadow-inner focus:shadow-md transition-all duration-300"
                            value={formData.username}
                            readOnly
                            disabled
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100/50 hover:border-green-200/50 group">
                    <div className="flex items-center space-x-3 pb-4 mb-6">
                      <div className="p-2 bg-green-500 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">ข้อมูลติดต่อ</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          อีเมล
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300"
                            value={formData.email}
                            readOnly
                            disabled
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          เบอร์โทรศัพท์
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            name="phone"
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300"
                            value={formData.phone}
                            readOnly
                            disabled
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          ที่อยู่
                        </label>
                        <div className="relative">
                          <textarea
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300 resize-none"
                            rows="3"
                            value={formData.street || ''}
                            readOnly
                            disabled
                          />
                          <div className="absolute top-3 right-3">
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            จังหวัด
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300"
                              value={formData.province || ''}
                              readOnly
                              disabled
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            อำเภอ
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300"
                              value={formData.district || ''}
                              readOnly
                              disabled
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            ตำบล
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner focus:shadow-md transition-all duration-300"
                              value={formData.parish || ''}
                              readOnly
                              disabled
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          รหัสไปรษณีย์
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-100 shadow-inner transition-all duration-300"
                            value={formData.postal_no || ''}
                            readOnly
                            disabled
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}