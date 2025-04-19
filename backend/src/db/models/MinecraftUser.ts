import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'minecraft_users',
  timestamps: true
})
export class MinecraftUser extends Model {
  @Column({
    type: DataType.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true,
    validate: {
      isUUID: 4
    },
    comment: 'Minecraft player UUID'
  })
  uuid!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
    comment: 'Solana wallet address'
  })
  walletAddress!: string | null;
}