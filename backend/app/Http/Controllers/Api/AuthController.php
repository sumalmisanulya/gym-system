<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle authentication and issue Sanctum token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The credentials provided are incorrect.'],
            ]);
        }

        // Define Sanctum token abilities based on role
        $abilities = [];
        switch ($user->role) {
            case 'admin':
                $abilities = ['*']; // Full capabilities
                break;
            case 'staff':
                $abilities = ['check-in-members', 'view-members'];
                break;
            case 'trainer':
                $abilities = ['view-clients', 'update-workouts'];
                break;
            case 'member':
            default:
                $abilities = ['view-profile', 'book-classes'];
                break;
        }

        $token = $user->createToken('gym_access_token', $abilities)->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ]);
    }

    /**
     * Revoke current session token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.'
        ]);
    }
}
