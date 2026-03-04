import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ApiCodes } from '../../common/constants/api-codes';
import { paginate } from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { User } from '../auth/entities/user.entity';
import { ExternalContact } from './entities/external-contact.entity';
import { CreateExternalContactDto } from './dto/create-external-contact.dto';
import { UpdateExternalContactDto } from './dto/update-external-contact.dto';

@Injectable()
export class ExternalContactsService {
  constructor(
    @InjectRepository(ExternalContact)
    private readonly externalContactRepository: Repository<ExternalContact>,
  ) {}

  async create(dto: CreateExternalContactDto, user: User) {
    const contact = this.externalContactRepository.create({
      ownerUserId: user.id,
      alias: dto.alias,
      email: dto.email ?? null,
      phoneNumber: dto.phoneNumber ?? null,
    });

    const saved = await this.externalContactRepository.save(contact);

    return {
      id: saved.id,
      alias: saved.alias,
      email: saved.email,
      phoneNumber: saved.phoneNumber,
      createdAt: saved.createdAt,
    };
  }

  async findAll(user: User, page: number = 1, limit: number = 10) {
    const [contacts, total] = await this.externalContactRepository.findAndCount({
      where: { ownerUserId: user.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = contacts.map((c) => ({
      id: c.id,
      alias: c.alias,
      email: c.email,
      phoneNumber: c.phoneNumber,
      createdAt: c.createdAt,
    }));

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const contact = await this.externalContactRepository.findOne({
      where: { id },
    });

    if (!contact) {
      throw new ApiException(ApiCodes.EXTERNAL_CONTACT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    return {
      id: contact.id,
      alias: contact.alias,
      email: contact.email,
      phoneNumber: contact.phoneNumber,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }

  async update(id: string, dto: UpdateExternalContactDto, user: User) {
    const contact = await this.externalContactRepository.findOne({
      where: { id, ownerUserId: user.id },
    });

    if (!contact) {
      throw new ApiException(ApiCodes.EXTERNAL_CONTACT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (dto.alias !== undefined) contact.alias = dto.alias;
    if (dto.email !== undefined) contact.email = dto.email;
    if (dto.phoneNumber !== undefined) contact.phoneNumber = dto.phoneNumber;

    const saved = await this.externalContactRepository.save(contact);

    return {
      id: saved.id,
      alias: saved.alias,
      email: saved.email,
      phoneNumber: saved.phoneNumber,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async remove(id: string, user: User) {
    const contact = await this.externalContactRepository.findOne({
      where: { id, ownerUserId: user.id },
    });

    if (!contact) {
      throw new ApiException(ApiCodes.EXTERNAL_CONTACT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.externalContactRepository.softRemove(contact);

    return { message: 'External contact deleted successfully' };
  }
}
