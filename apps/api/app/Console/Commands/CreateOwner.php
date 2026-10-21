<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class CreateOwner extends Command
{
    protected $signature = 'taller:owner';

    protected $description = 'Crea la única cuenta propietaria con datos proporcionados por el operador.';

    public function handle(): int
    {
        if (User::where('is_owner', true)->exists()) {
            $this->error('Ya existe una cuenta propietaria. No se ha creado otra.');

            return self::FAILURE;
        }
        $name = $this->ask('Nombre del propietario');
        $email = $this->ask('Correo electrónico');
        $password = $this->secret('Contraseña (mínimo 12 caracteres)');
        $confirmation = $this->secret('Repite la contraseña');
        $validator = Validator::make(['name' => $name, 'email' => $email, 'password' => $password, 'password_confirmation' => $confirmation], ['name' => ['required', 'string', 'max:180'], 'email' => ['required', 'email', 'unique:users,email'], 'password' => ['required', 'string', 'min:12', 'confirmed']]);
        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }
        $user = new User(['name' => $name, 'email' => $email, 'password' => $password]);
        $user->forceFill(['is_owner' => true])->save();
        $this->info('Cuenta propietaria creada. No se han añadido materiales ni precios ficticios.');

        return self::SUCCESS;
    }
}
