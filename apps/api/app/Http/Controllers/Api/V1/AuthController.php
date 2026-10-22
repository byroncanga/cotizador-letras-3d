<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages(['email' => 'Las credenciales no coinciden. Revisa el correo y la contraseña.']);
        }
        $request->session()->regenerate();

        return $this->me($request);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json(['data' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'isOwner' => $user->is_owner]]);
    }

    public function setupStatus(): JsonResponse
    {
        return response()->json(['data' => ['needsOwner' => ! User::where('is_owner', true)->exists()]]);
    }

    public function createInitialOwner(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ]);

        $user = DB::transaction(function () use ($data): User {
            abort_if(User::where('is_owner', true)->exists(), 409, 'La cuenta propietaria ya fue creada.');
            $user = User::create($data);
            $user->forceFill(['is_owner' => true])->save();

            return $user;
        });

        Auth::login($user);
        $request->session()->regenerate();

        return $this->me($request);
    }

    public function users(): JsonResponse
    {
        $users = User::query()->orderBy('name')->get(['id', 'name', 'email', 'is_owner', 'created_at']);

        return response()->json(['data' => $users->map(fn (User $user): array => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'isOwner' => $user->is_owner,
            'createdAt' => $user->created_at->toISOString(),
        ])]);
    }

    public function createUser(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
            'isOwner' => ['required', 'boolean'],
        ]);
        $user = User::create(['name' => $data['name'], 'email' => $data['email'], 'password' => $data['password']]);
        $user->forceFill(['is_owner' => $data['isOwner']])->save();

        return response()->json(['data' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'isOwner' => $user->is_owner,
            'createdAt' => $user->created_at->toISOString(),
        ]], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión cerrada.']);
    }
}
