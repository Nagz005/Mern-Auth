import React, { useContext, useEffect, useRef, useState } from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

const EmailVerify = () => {
  const { backendUrl, getUserData, isLoggedin, userData, isLoading } = useContext(AppContext);
  const navigate = useNavigate();
  const inputRefs = useRef(new Array(6));
  const [otpSubmitting, setOtpSubmitting] = useState(false);

  axios.defaults.withCredentials = true;

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Redirect if already verified
  useEffect(() => {
    if (!isLoading && isLoggedin && userData?.isAccountVerified) {
      navigate('/');
    }
  }, [isLoggedin, userData, navigate, isLoading]);

  // Handle input typing (digits only)
  const handleInput = (e, index) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    const pasteArray = paste.split('').slice(0, 6);
    pasteArray.forEach((char, index) => {
      if (inputRefs.current[index]) inputRefs.current[index].value = char;
    });
    if (pasteArray.length === 6) {
      onSubmitHandler(e);
    }
  };

  // OTP submission
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    // Use email from userData or fallback to localStorage
    const email = userData?.email || localStorage.getItem('otpEmail');

    if (email) {
      toast.error('User email not found. Please login again.');
      return;
    }

    const otp = inputRefs.current.map((el) => el.value).join('').trim();

    if (otp.length !== 6) {
      toast.error('Please enter all 6 digits of the OTP');
      return;
    }

    try {
      setOtpSubmitting(true);
      const response = await axios.post(
        `${backendUrl}/api/auth/verify-account`,
        { email, otp },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );

      const data = response.data;

      if (data.success) {
        toast.success(data.message || 'Email verified successfully!');
        await getUserData();
        localStorage.removeItem('otpEmail'); // clear fallback
        navigate('/');
      } else {
        toast.error(data.message || 'Verification failed!');
      }
    } catch (error) {
      console.error('Verify error:', error);
      toast.error(error.response?.data?.message || 'Failed to verify email. Try again.');
    } finally {
      setOtpSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-white text-center mt-20">Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-gray-900 to-indigo-900">
      <img
        onClick={() => navigate('/')}
        src={assets.logo}
        alt="Logo"
        className="absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer"
      />

      <form
        onSubmit={onSubmitHandler}
        className="bg-slate-900 p-8 rounded-lg w-96 text-sm shadow-lg shadow-indigo-500/20"
      >
        <h1 className="text-white text-2xl font-semibold text-center mb-4">
          Email Verify OTP
        </h1>
        <p className="text-center mb-6 text-indigo-300">
          Enter the 6-digit code sent to your email.
        </p>

        <div className="flex justify-between mb-8" onPaste={handlePaste}>
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                required
                aria-label={`OTP digit ${index + 1}`}
                className="w-12 h-12 bg-[#333A5C] text-white text-center text-xl rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ref={(el) => (inputRefs.current[index] = el)}
                onInput={(e) => handleInput(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
        </div>

        <button
          type="submit"
          disabled={otpSubmitting}
          className={`w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full hover:opacity-90 ${
            otpSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {otpSubmitting ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>
    </div>
  );
};

export default EmailVerify;
